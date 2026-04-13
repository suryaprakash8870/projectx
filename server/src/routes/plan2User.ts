import { Router } from 'express';
import { db } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// All routes require JWT with planType === 'PLAN2'
function requirePlan2User(req: any, res: any, next: any) {
  if (req.user?.planType !== 'PLAN2') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Plan 2 access only.' });
    return;
  }
  next();
}

// GET /api/plan2/users/me
router.get('/me', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const user = await db.plan2User.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: {
        id: true,
        memberId: true,
        sequenceNumber: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        status: true,
        canRefer: true,
        createdAt: true,
        referrer: { select: { memberId: true, name: true } },
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/plan2/wallet
router.get('/wallet', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const wallet = await db.plan2Wallet.findUniqueOrThrow({
      where: { userId: req.user!.userId },
      select: { incomeBalance: true, updatedAt: true },
    });
    res.json(wallet);
  } catch (err) {
    next(err);
  }
});

// GET /api/plan2/wallet/transactions
router.get('/wallet/transactions', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const wallet = await db.plan2Wallet.findUniqueOrThrow({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    const txs = await db.plan2WalletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(txs);
  } catch (err) {
    next(err);
  }
});

// GET /api/plan2/investment/my — current user's investment status + pending/approved requests
router.get('/investment/my', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const [requests, investments] = await Promise.all([
      db.plan2InvestmentRequest.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.plan2Investment.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const totalInvested = investments
      .filter((i) => i.active)
      .reduce((sum, i) => sum + i.amount, 0);
    res.json({ requests, investments, totalInvested });
  } catch (err) {
    next(err);
  }
});

// POST /api/plan2/investment/request — user submits investment request (₹50k or ₹100k)
router.post('/investment/request', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (amount !== 50000 && amount !== 100000) {
      res.status(400).json({ error: 'VALIDATION', message: 'Investment must be ₹50,000 or ₹1,00,000.' });
      return;
    }

    // Reject if there's already a pending request
    const pending = await db.plan2InvestmentRequest.findFirst({
      where: { userId: req.user!.userId, status: 'PENDING' },
    });
    if (pending) {
      res.status(409).json({
        error: 'PENDING_EXISTS',
        message: 'You already have a pending investment request.',
      });
      return;
    }

    const request = await db.plan2InvestmentRequest.create({
      data: { userId: req.user!.userId, amount },
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// GET /api/plan2/network/stats — count of direct referrals and their investment sum
router.get('/network/stats', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const me = await db.plan2User.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: { memberId: true },
    });

    const directReferrals = await db.plan2User.count({
      where: { referrerId: req.user!.userId },
    });

    // Total amount invested by direct referrals (active only)
    const referredInvestments = await db.plan2Investment.findMany({
      where: {
        active: true,
        user: { referrerId: req.user!.userId },
      },
      select: { amount: true },
    });
    const directInvestedTotal = referredInvestments.reduce((s, i) => s + i.amount, 0);

    res.json({
      memberId: me.memberId,
      directReferrals,
      directInvestedTotal,
      expectedMonthlyReferralReturn: Math.floor(directInvestedTotal * 0.02),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/plan2/network/downline — flat list of the user's referral tree (for visualization)
// Returns all descendants following referrerId pointers.
router.get('/network/downline', jwtAuth, requirePlan2User, async (req, res, next) => {
  try {
    const rootId = req.user!.userId;

    // BFS through referrals
    const visited = new Set<string>();
    const queue: string[] = [rootId];
    const allDescendants: any[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await db.plan2User.findMany({
        where: { referrerId: currentId },
        select: {
          id: true,
          memberId: true,
          name: true,
          status: true,
          canRefer: true,
          referrerId: true,
          createdAt: true,
          investments: {
            where: { active: true },
            select: { amount: true },
          },
        },
      });

      for (const c of children) {
        const totalInvested = c.investments.reduce((s, i) => s + i.amount, 0);
        allDescendants.push({
          id: c.id,
          memberId: c.memberId,
          name: c.name,
          status: c.status,
          canRefer: c.canRefer,
          referrerId: c.referrerId,
          totalInvested,
          createdAt: c.createdAt,
        });
        queue.push(c.id);
      }
    }

    res.json(allDescendants);
  } catch (err) {
    next(err);
  }
});

export default router;
