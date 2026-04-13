import { Router } from 'express';
import { db } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { distributeReturns } from '../services/plan2Returns';

const router = Router();

// GET /api/admin/plan2/stats — KPI overview for Plan 2 admin dashboard
router.get('/stats', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      pendingRequests,
      approvedRequests,
      totalInvestments,
      totalInvestedAgg,
      totalReturnsAgg,
      runs,
    ] = await Promise.all([
      db.plan2User.count(),
      db.plan2User.count({ where: { status: 'ACTIVE' } }),
      db.plan2User.count({ where: { status: 'PENDING' } }),
      db.plan2InvestmentRequest.count({ where: { status: 'PENDING' } }),
      db.plan2InvestmentRequest.count({ where: { status: 'APPROVED' } }),
      db.plan2Investment.count({ where: { active: true } }),
      db.plan2Investment.aggregate({ where: { active: true }, _sum: { amount: true } }),
      db.plan2ReturnRun.aggregate({
        _sum: { totalMonthlyCredit: true, totalReferralCredit: true },
      }),
      db.plan2ReturnRun.count(),
    ]);

    res.json({
      totalMembers,
      activeMembers,
      pendingMembers,
      pendingRequests,
      approvedRequests,
      totalInvestments,
      totalInvestedAmount: totalInvestedAgg._sum.amount || 0,
      totalMonthlyReturnsPaid: totalReturnsAgg._sum.totalMonthlyCredit || 0,
      totalReferralReturnsPaid: totalReturnsAgg._sum.totalReferralCredit || 0,
      totalRunsCompleted: runs,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/plan2/members — list all Plan 2 users with their investment totals
router.get('/members', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { memberId: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { mobile: { contains: search as string } },
      ];
    }

    const [members, total] = await Promise.all([
      db.plan2User.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          investments: { where: { active: true }, select: { amount: true } },
          referrer: { select: { memberId: true, name: true } },
          wallet: { select: { incomeBalance: true } },
        },
      }),
      db.plan2User.count({ where }),
    ]);

    const enriched = members.map((m) => ({
      id: m.id,
      memberId: m.memberId,
      name: m.name,
      mobile: m.mobile,
      email: m.email,
      status: m.status,
      canRefer: m.canRefer,
      createdAt: m.createdAt,
      totalInvested: m.investments.reduce((s, i) => s + i.amount, 0),
      incomeBalance: m.wallet?.incomeBalance || 0,
      referrer: m.referrer,
    }));

    res.json({
      members: enriched,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/plan2/investment-requests
router.get('/investment-requests', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const requests = await db.plan2InvestmentRequest.findMany({
      where: status ? { status: status as string } : undefined,
      include: {
        user: {
          select: { memberId: true, name: true, mobile: true, referrer: { select: { memberId: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/plan2/investment-requests/:id/approve
router.post('/investment-requests/:id/approve', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const request = await db.plan2InvestmentRequest.findUniqueOrThrow({
      where: { id: req.params.id },
    });
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'NOT_PENDING', message: 'Request is not pending.' });
      return;
    }

    await db.$transaction(async (tx) => {
      // Mark request approved
      await tx.plan2InvestmentRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });

      // Create the active investment
      await tx.plan2Investment.create({
        data: {
          userId: request.userId,
          requestId: request.id,
          amount: request.amount,
          active: true,
        },
      });

      // Enable referral ability + activate user (in case still PENDING from OTP)
      await tx.plan2User.update({
        where: { id: request.userId },
        data: { canRefer: true, status: 'ACTIVE' },
      });
    });

    res.json({ message: 'Investment approved. User is now active and can refer.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/plan2/investment-requests/:id/reject
router.post('/investment-requests/:id/reject', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { note } = req.body;
    const request = await db.plan2InvestmentRequest.findUniqueOrThrow({
      where: { id: req.params.id },
    });
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'NOT_PENDING', message: 'Request is not pending.' });
      return;
    }
    await db.plan2InvestmentRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED', note: note || 'Rejected by admin' },
    });
    res.json({ message: 'Investment request rejected.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/plan2/distribute-returns — admin clicks monthly distribution
// Body: { monthKey: 'YYYY-MM' }  (defaults to current month if omitted)
router.post('/distribute-returns', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    let { monthKey } = req.body;
    if (!monthKey) {
      const now = new Date();
      monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      res.status(400).json({ error: 'VALIDATION', message: 'monthKey must be in YYYY-MM format.' });
      return;
    }

    const result = await distributeReturns(monthKey, req.user!.userId, db);
    res.json({ message: `Returns distributed for ${monthKey}`, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/plan2/return-runs — history of distribution runs
router.get('/return-runs', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const runs = await db.plan2ReturnRun.findMany({
      orderBy: { runAt: 'desc' },
    });
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/plan2/return-payouts — payout log (all credits across all runs)
router.get('/return-payouts', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { monthKey, kind, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (monthKey) where.monthKey = monthKey;
    if (kind) where.kind = kind;

    const [payouts, total] = await Promise.all([
      db.plan2ReturnPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          recipient: { select: { memberId: true, name: true } },
        },
      }),
      db.plan2ReturnPayout.count({ where }),
    ]);

    res.json({
      payouts,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
