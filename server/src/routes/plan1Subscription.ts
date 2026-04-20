import { Router } from 'express';
import { db } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateGtcAddress(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `GTC-${userId.replace(/-/g, '').substring(0, 6).toUpperCase()}-${rand}`;
}

// ── User: submit subscription request ────────────────────────────────────────
// POST /api/plan1/subscribe
router.post('/subscribe', jwtAuth, async (req: any, res, next) => {
  try {
    const userId = req.user!.userId;

    // Block if PENDING or ACTIVE subscription already exists
    const existing = await db.plan1Subscription.findFirst({
      where: { userId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
    if (existing) {
      res.status(400).json({
        message: existing.status === 'ACTIVE'
          ? 'You already have an active Plan 1 subscription.'
          : 'A subscription request is already pending admin approval.',
      });
      return;
    }

    const sub = await db.plan1Subscription.create({ data: { userId } });
    res.status(201).json(sub);
  } catch (err) { next(err); }
});

// ── User: get own subscription status ────────────────────────────────────────
// GET /api/plan1/subscription
router.get('/subscription', jwtAuth, async (req: any, res, next) => {
  try {
    const userId = req.user!.userId;

    // Auto-expire any ACTIVE subscriptions past their expiresAt
    await db.plan1Subscription.updateMany({
      where: { userId, status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const sub = await db.plan1Subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sub || null);
  } catch (err) { next(err); }
});

// ── Admin: list all subscription requests ────────────────────────────────────
// GET /api/plan1/admin/subscriptions?status=PENDING
router.get('/admin/subscriptions', jwtAuth, requireAdmin, async (req: any, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const subs = await db.plan1Subscription.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { memberId: true, name: true, mobile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(subs);
  } catch (err) { next(err); }
});

// ── Admin: approve subscription ───────────────────────────────────────────────
// POST /api/plan1/admin/subscriptions/:id/approve
router.post('/admin/subscriptions/:id/approve', jwtAuth, requireAdmin, async (req: any, res, next) => {
  try {
    const sub = await db.plan1Subscription.findUniqueOrThrow({ where: { id: req.params.id } });
    if (sub.status !== 'PENDING') {
      res.status(400).json({ message: 'Only PENDING subscriptions can be approved.' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const SUBSCRIPTION_FEE = 250;
    const GST_AMOUNT = 45;                   // 18% of ₹250
    const SUBSCRIPTION_INCOME = SUBSCRIPTION_FEE - GST_AMOUNT; // ₹205

    await db.$transaction(async (tx) => {
      await tx.plan1Subscription.update({
        where: { id: sub.id },
        data: { status: 'ACTIVE', approvedAt: new Date(), expiresAt, gtcCredited: true },
      });

      // ── Credit user: 500 GTC coins ──────────────────────────────────
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: sub.userId } });
      const gtcAddress = wallet.gtcAddress || generateGtcAddress(sub.userId);

      await tx.wallet.update({
        where: { userId: sub.userId },
        data: {
          gtcBalance: { increment: 500 },
          gtcAddress: wallet.gtcAddress ? undefined : gtcAddress,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          field: 'GTC',
          amount: 500,
          note: 'Plan 1 subscription bonus — 500 GTC coins',
          sourceRef: sub.id,
        },
      });

      // ── Credit admin: ₹45 GST + ₹205 subscription income ──────────
      const adminUser = await tx.user.findFirstOrThrow({ where: { role: 'ADMIN' }, select: { id: true } });
      const adminWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: adminUser.id } });

      await tx.wallet.update({
        where: { userId: adminUser.id },
        data: {
          gstBalance: { increment: GST_AMOUNT },
          incomeBalance: { increment: SUBSCRIPTION_INCOME },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: adminWallet.id,
          type: 'CREDIT',
          field: 'GST',
          amount: GST_AMOUNT,
          note: `GST 18% from Plan 1 subscription (₹${GST_AMOUNT})`,
          sourceRef: sub.id,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: adminWallet.id,
          type: 'CREDIT',
          field: 'INCOME',
          amount: SUBSCRIPTION_INCOME,
          note: `Plan 1 subscription income (₹${SUBSCRIPTION_INCOME})`,
          sourceRef: sub.id,
        },
      });
    }, { timeout: 15000 });

    res.json({ message: 'Subscription approved. 500 GTC credited, ₹45 GST + ₹205 income recorded.' });
  } catch (err) { next(err); }
});

// ── Admin: reject subscription ────────────────────────────────────────────────
// POST /api/plan1/admin/subscriptions/:id/reject
router.post('/admin/subscriptions/:id/reject', jwtAuth, requireAdmin, async (req: any, res, next) => {
  try {
    const { note } = req.body;
    const sub = await db.plan1Subscription.findUniqueOrThrow({ where: { id: req.params.id } });
    if (sub.status !== 'PENDING') {
      res.status(400).json({ message: 'Only PENDING subscriptions can be rejected.' });
      return;
    }
    await db.plan1Subscription.update({
      where: { id: sub.id },
      data: { status: 'REJECTED', note: note || null },
    });
    res.json({ message: 'Subscription rejected.' });
  } catch (err) { next(err); }
});

// ── Admin: stats for Plan 1 subscriptions ────────────────────────────────────
// GET /api/plan1/admin/stats
router.get('/admin/stats', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    // Auto-expire past subscriptions
    await db.plan1Subscription.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const approvedCount = await db.plan1Subscription.count({ where: { status: { in: ['ACTIVE', 'EXPIRED'] } } });

    const [total, active, pending, expired] = await Promise.all([
      db.plan1Subscription.count(),
      db.plan1Subscription.count({ where: { status: 'ACTIVE' } }),
      db.plan1Subscription.count({ where: { status: 'PENDING' } }),
      db.plan1Subscription.count({ where: { status: 'EXPIRED' } }),
    ]);

    // Revenue: each approved subscription = ₹45 GST + ₹205 income
    const totalGst = approvedCount * 45;
    const totalSubscriptionIncome = approvedCount * 205;
    const totalRevenue = approvedCount * 250;

    res.json({ total, active, pending, expired, totalGst, totalSubscriptionIncome, totalRevenue, approvedCount });
  } catch (err) { next(err); }
});

export default router;
