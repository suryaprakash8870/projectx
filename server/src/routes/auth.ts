import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateNextMemberId } from '../services/memberIdService';
import { addToNetwork } from '../services/networkService';
import { generateAndSendOTP, verifyOTP } from '../services/otpService';
import { jwtAuth } from '../middleware/jwtAuth';
import { rateLimit } from '../middleware/rateLimiter';

const router = Router();
const db = new PrismaClient();

function signTokens(userId: string, role: string, memberId: string) {
  const accessToken = jwt.sign(
    { userId, role, memberId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, role, memberId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// GET /api/auth/referral-check/:code
router.get('/referral-check/:code', async (req, res, next) => {
  try {
    const user = await db.user.findFirst({
      where: { memberId: req.params.code, status: { in: ['ACTIVE', 'PENDING'] } },
      select: { memberId: true, name: true, status: true }
    });
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Referral code not found.' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', rateLimit('REGISTER'), async (req, res, next) => {
  try {
    const { name, mobile, email, password, referralCode, leg } = req.body;
    if (!name || !mobile || !password) {
      res.status(400).json({ error: 'VALIDATION', message: 'Name, mobile and password are required.' });
      return;
    }
    if (referralCode && !['LEFT', 'RIGHT'].includes(leg)) {
      res.status(400).json({ error: 'VALIDATION', message: 'If joining via referral, you must select LEFT or RIGHT tree placement.' });
      return;
    }

    // Validate referral code
    let referrer = null;
    if (referralCode) {
      referrer = await db.user.findFirst({
        where: { memberId: referralCode, status: { in: ['ACTIVE', 'PENDING'] } },
      });
      if (!referrer) throw new Error('INVALID_REFERRAL_CODE');
    }

    // Generate next member ID
    const { memberId, sequenceNumber } = await generateNextMemberId(db);

    // Create user — real users start at cyclePosition 4
    // (joining cycle 0 consumes L1-L3, so referral pointer starts at L4)
    const user = await db.user.create({
      data: {
        memberId,
        sequenceNumber,
        name,
        mobile,
        email: email || null,
        passwordHash: await bcrypt.hash(password, 10),
        referrerId: referrer?.id ?? null,
        placementLeg: referrer ? leg : null,
        level: referrer ? referrer.level + 1 : 2,
        status: 'PENDING',
        cyclePosition: 1,
      },
    });

    // Create wallet
    await db.wallet.create({ data: { userId: user.id } });

    // Send OTP using AuthKey
    await generateAndSendOTP(mobile, 'VERIFY_ACCOUNT', db);

    res.status(201).json({ userId: user.id, memberId, message: 'Registration successful. Please verify OTP sent to mobile.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.mobile) {
      res.status(400).json({ error: 'INVALID_REQUEST', message: 'User does not have a mobile number.' });
      return;
    }

    // Verify OTP using real logic (will throw if invalid)
    try {
      await verifyOTP(user.mobile, otp, 'VERIFY_ACCOUNT', db);
    } catch (err) {
      res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid or expired OTP.' });
      return;
    }

    // Update status to ACTIVE
    await db.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' }
    });

    // Add to network tree based on selected leg
    await addToNetwork(user.id, user.referrerId, user.placementLeg, db);

    const tokens = signTokens(user.id, user.role, user.memberId);

    res.json({
      ...tokens,
      userId: user.id,
      memberId: user.memberId,
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', rateLimit('LOGIN'), async (req, res, next) => {
  try {
    const { mobile, email, password } = req.body;
    if (!password || (!mobile && !email)) {
      res.status(400).json({ error: 'VALIDATION', message: 'Mobile or email and password are required.' });
      return;
    }

    const user = await db.user.findFirst({
      where: mobile ? { mobile } : { email },
    });

    if (!user || !user.passwordHash) throw new Error('INVALID_CREDENTIALS');
    if (user.status === 'SUSPENDED') throw new Error('USER_NOT_ACTIVE');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    const tokens = signTokens(user.id, user.role, user.memberId);

    res.json({
      ...tokens,
      userId: user.id,
      memberId: user.memberId,
      role: user.role,
      name: user.name,
      status: user.status,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'VALIDATION', message: 'Refresh token required.' });
      return;
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      role: string;
      memberId: string;
    };

    const tokens = signTokens(payload.userId, payload.role, payload.memberId);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid refresh token.' });
  }
});

// POST /api/auth/forgot-password-request
router.post('/forgot-password-request', rateLimit('OTP_REQUEST'), async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      res.status(400).json({ error: 'VALIDATION', message: 'Mobile number is required.' });
      return;
    }

    const user = await db.user.findFirst({ where: { mobile } });
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
      return;
    }

    await generateAndSendOTP(mobile, 'RESET_PASSWORD', db);
    res.json({ message: 'Password reset OTP sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password-submit
router.post('/forgot-password-submit', async (req, res, next) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword) {
      res.status(400).json({ error: 'VALIDATION', message: 'Mobile, OTP, and new password are required.' });
      return;
    }

    try {
      await verifyOTP(mobile, otp, 'RESET_PASSWORD', db);
    } catch {
      res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid or expired OTP.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { mobile },
      data: { passwordHash }
    });

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password
router.post('/change-password', jwtAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'VALIDATION', message: 'Old and new passwords are required.' });
      return;
    }

    const userId = req.user!.userId;
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.passwordHash) {
      res.status(400).json({ error: 'INVALID_STATE', message: 'No password set.' });
      return;
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'INVALID_CREDENTIALS', message: 'Incorrect old password.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
