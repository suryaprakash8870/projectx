import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateNextPlan2MemberId } from '../services/plan2IdService';
import { generateAndSendOTP, verifyOTP } from '../services/otpService';
import { rateLimit } from '../middleware/rateLimiter';

const router = Router();
const db = new PrismaClient();

// GET /api/plan2/auth/referral-check/:code
// Checks if a Plan 2 referral memberId exists and is allowed to refer.
// Admin (Plan 1 User with role=ADMIN) can also be used as a referral by matching memberId.
router.get('/referral-check/:code', async (req, res, next) => {
  try {
    const code = req.params.code;

    // Plan 2 user — must be active AND allowed to refer
    const plan2 = await db.plan2User.findFirst({
      where: { memberId: code, status: 'ACTIVE', canRefer: true },
      select: { memberId: true, name: true, status: true },
    });
    if (plan2) {
      res.json({ ...plan2, kind: 'PLAN2_USER' });
      return;
    }

    // Admin user (Plan 1 User with role=ADMIN) — always allowed
    const admin = await db.user.findFirst({
      where: { memberId: code, role: 'ADMIN' },
      select: { memberId: true, name: true, status: true },
    });
    if (admin) {
      res.json({ ...admin, kind: 'ADMIN' });
      return;
    }

    res.status(404).json({ error: 'NOT_FOUND', message: 'Referral code not found or not allowed to refer.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/plan2/auth/register — new Plan 2 user submits signup form (via referral link)
router.post('/register', rateLimit('REGISTER'), async (req, res, next) => {
  try {
    const { name, mobile, email, password, referralCode } = req.body;
    if (!name || !mobile || !password || !referralCode) {
      res.status(400).json({ error: 'VALIDATION', message: 'Name, mobile, password and referral code are required.' });
      return;
    }

    // Validate referral code — must be an allowed Plan 2 user or admin
    let referrerPlan2Id: string | null = null;
    const plan2Referrer = await db.plan2User.findFirst({
      where: { memberId: referralCode, status: 'ACTIVE', canRefer: true },
    });
    if (plan2Referrer) {
      referrerPlan2Id = plan2Referrer.id;
    } else {
      const adminReferrer = await db.user.findFirst({
        where: { memberId: referralCode, role: 'ADMIN' },
      });
      if (!adminReferrer) throw new Error('INVALID_REFERRAL_CODE');
      // Admin referral → referrerId stays null in Plan2User (admin not in Plan2 table)
      referrerPlan2Id = null;
    }

    // Check mobile not already used in Plan 2
    const existing = await db.plan2User.findFirst({ where: { mobile } });
    if (existing) throw new Error('DUPLICATE_MOBILE');

    // Generate memberId
    const { memberId, sequenceNumber } = await generateNextPlan2MemberId(db, name, mobile);

    const plan2User = await db.plan2User.create({
      data: {
        memberId,
        sequenceNumber,
        name,
        mobile,
        email: email || null,
        passwordHash: await bcrypt.hash(password, 10),
        referrerId: referrerPlan2Id,
        status: 'PENDING',
        canRefer: false,
      },
    });

    // Plan 2 wallet
    await db.plan2Wallet.create({ data: { userId: plan2User.id } });

    // Send OTP (reuses Plan 1 OTP service; purpose string distinguishes it)
    await generateAndSendOTP(mobile, 'VERIFY_ACCOUNT', db);

    res.status(201).json({
      userId: plan2User.id,
      memberId,
      message: 'Plan 2 registration successful. Please verify OTP sent to mobile.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/plan2/auth/verify-otp — activates the Plan 2 user after OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const plan2User = await db.plan2User.findUniqueOrThrow({ where: { id: userId } });

    try {
      await verifyOTP(plan2User.mobile, otp, 'VERIFY_ACCOUNT', db);
    } catch {
      res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid or expired OTP.' });
      return;
    }

    await db.plan2User.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    res.json({
      userId: plan2User.id,
      memberId: plan2User.memberId,
      message: 'OTP verified. Your account is active. Please submit an investment request to continue.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
