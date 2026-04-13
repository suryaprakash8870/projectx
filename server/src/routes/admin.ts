import { Router } from 'express';
import { db } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// GET /api/admin/stats — KPI overview
router.get('/stats', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    // Find admin user id so we can split "paid to users" vs "admin revenue"
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    const adminId = adminUser?.id ?? '';

    const [
      totalMembers,
      rootUsers,
      regularUsers,
      todayJoinings,
      totalGst,
      totalPayoutToUsers,
      totalRevenueToAdmin,
      pendingRequests,
      totalVendors,
      pendingVendors,
    ] = await Promise.all([
      db.user.count({ where: { role: 'MEMBER' } }),
      db.user.count({ where: { sequenceNumber: { gte: 1, lte: 512 } } }),
      db.user.count({ where: { sequenceNumber: { gt: 512 }, role: 'MEMBER' } }),
      db.joiningRequest.count({
        where: {
          status: 'APPROVED',
          approvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      db.gstRecord.aggregate({ _sum: { amount: true } }),
      // Paid out to members = payoutRecord rows NOT going to admin (Self + real upline L1-L9)
      db.payoutRecord.aggregate({
        where: { NOT: { recipientId: adminId } },
        _sum: { amount: true },
      }),
      // Admin revenue = fallback referral slots + platform fee
      db.payoutRecord.aggregate({
        where: { recipientId: adminId },
        _sum: { amount: true },
      }),
      db.joiningRequest.count({ where: { status: 'PENDING' } }),
      db.vendor.count({ where: { isApproved: true } }),
      db.vendor.count({ where: { isApproved: false } }),
    ]);

    // Daily joinings for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJoinings = await db.joiningRequest.findMany({
      where: { status: 'APPROVED', approvedAt: { gte: thirtyDaysAgo } },
      select: { approvedAt: true },
    });

    const dailyMap: Record<string, number> = {};
    for (const j of recentJoinings) {
      if (!j.approvedAt) continue;
      const key = j.approvedAt.toISOString().split('T')[0];
      dailyMap[key] = (dailyMap[key] || 0) + 1;
    }

    const totalJoinings = await db.joiningRequest.count({ where: { status: 'APPROVED' } });
    const companyFeeTotal = totalJoinings * 70;

    // Cycle distribution (1-9 referral pointer)
    const cycleDistribution = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(async (cycle) => ({
        cycle,
        count: await db.user.count({
          where: { cyclePosition: cycle, role: 'MEMBER' },
        }),
      }))
    );

    // Revenue split totals
    const revenueSplitTotals = await db.revenueSplit.aggregate({
      _sum: {
        platformFee: true,
        gstAmount: true,
        companyAmount: true,
        userAmount: true,
      },
    });

    res.json({
      totalMembers,
      rootUsers,
      regularUsers,
      todayJoinings,
      totalJoinings,
      pendingRequests,
      gstCollected: totalGst._sum.amount || 0,
      totalPayoutAmount: totalPayoutToUsers._sum.amount || 0,
      totalRevenueAmount: totalRevenueToAdmin._sum.amount || 0,
      companyFeeTotal,
      dailyJoinings: dailyMap,
      totalVendors,
      pendingVendors,
      cycleDistribution,
      revenueSplit: {
        totalPlatformFee: revenueSplitTotals._sum.platformFee || 0,
        totalGst: revenueSplitTotals._sum.gstAmount || 0,
        totalCompany: revenueSplitTotals._sum.companyAmount || 0,
        totalUsers: revenueSplitTotals._sum.userAmount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/members — filter by type, search
router.get('/members', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { type, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { role: 'MEMBER' };
    if (type === 'ROOT') where.sequenceNumber = { gte: 1, lte: 512 };
    else if (type === 'USER') where.sequenceNumber = { gt: 512 };

    if (search) {
      where.OR = [
        { memberId: { contains: search as string } },
        { name: { contains: search as string } },
        { mobile: { contains: search as string } },
      ];
    }

    const [members, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          memberId: true,
          name: true,
          mobile: true,
          sequenceNumber: true,
          status: true,
          level: true,
          cyclePosition: true,
          createdAt: true,
          wallet: {
            select: {
              couponBalance: true,
              purchaseBalance: true,
              incomeBalance: true,
              gstBalance: true,
            },
          },
          referrer: { select: { memberId: true } },
        },
        orderBy: { sequenceNumber: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      db.user.count({ where }),
    ]);

    res.json({
      members,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/payout-log
router.get('/payout-log', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { type, cycle, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (cycle) where.cycleSlot = parseInt(cycle as string);

    const [records, total] = await Promise.all([
      db.payoutRecord.findMany({
        where,
        include: {
          recipient: { select: { memberId: true, name: true, sequenceNumber: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      db.payoutRecord.count({ where }),
    ]);

    const joinerIds = [...new Set(records.map((r) => r.joinerId))];
    const joiners = await db.user.findMany({
      where: { id: { in: joinerIds } },
      select: { id: true, memberId: true },
    });
    const joinerMap = Object.fromEntries(joiners.map((j) => [j.id, j.memberId]));

    const enriched = records.map((r) => ({
      ...r,
      joinerMemberId: joinerMap[r.joinerId] || r.joinerId,
    }));

    res.json({
      records: enriched,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/company-revenue — payouts to admin's referral income wallet
router.get('/company-revenue', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const admin = await db.user.findFirstOrThrow({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    // Referral fallback (missing upline) — levelDiff 1-9 (positive)
    const referralTotal = await db.payoutRecord.aggregate({
      where: { recipientId: admin.id, levelDiff: { gte: 0 } },
      _sum: { amount: true },
      _count: true,
    });

    // Platform fee — levelDiff = -1 (sentinel)
    const platformFeeTotal = await db.payoutRecord.aggregate({
      where: { recipientId: admin.id, levelDiff: -1 },
      _sum: { amount: true },
      _count: true,
    });

    const records = await db.payoutRecord.findMany({
      where: { recipientId: admin.id, levelDiff: { gte: 0 } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const dailyMap: Record<string, number> = {};
    for (const r of records) {
      const key = r.createdAt.toISOString().split('T')[0];
      dailyMap[key] = (dailyMap[key] || 0) + r.amount;
    }

    res.json({
      total: referralTotal._sum.amount || 0,
      count: referralTotal._count,
      platformFeeTotal: platformFeeTotal._sum.amount || 0,
      platformFeeCount: platformFeeTotal._count,
      daily: dailyMap,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/gst-report
router.get('/gst-report', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const [records, total] = await Promise.all([
      db.gstRecord.findMany({ where, orderBy: { createdAt: 'desc' } }),
      db.gstRecord.aggregate({ where, _sum: { amount: true }, _count: true }),
    ]);

    res.json({
      records,
      totalAmount: total._sum.amount || 0,
      totalCount: total._count,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/revenue-splits — marketplace revenue breakdown
router.get('/revenue-splits', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [records, total, totals] = await Promise.all([
      db.revenueSplit.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      db.revenueSplit.count(),
      db.revenueSplit.aggregate({
        _sum: {
          platformFee: true,
          gstAmount: true,
          companyAmount: true,
          userAmount: true,
          totalAmount: true,
        },
      }),
    ]);

    res.json({
      records,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
      totals: {
        platformFee: totals._sum.platformFee || 0,
        gst: totals._sum.gstAmount || 0,
        company: totals._sum.companyAmount || 0,
        users: totals._sum.userAmount || 0,
        totalSales: totals._sum.totalAmount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/cycle-report — cycle-based payout analytics
router.get('/cycle-report', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const cycleStats = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(async (cycle) => {
        const payouts = await db.payoutRecord.aggregate({
          where: { cycleSlot: cycle },
          _sum: { amount: true },
          _count: true,
        });

        return {
          cycle,
          totalPayouts: payouts._count,
          totalAmount: payouts._sum.amount || 0,
        };
      })
    );

    res.json({ cycles: cycleStats });
  } catch (err) {
    next(err);
  }
});

export default router;
