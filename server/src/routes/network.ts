import { Router } from 'express';
import { db } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import {
  getUplineChain,
  getDownlineTree,
  getNetworkStats,
} from '../services/networkService';
import { getCycleReceivers } from '../services/payoutEngine';

const router = Router();

// GET /api/network/upline
router.get('/upline', jwtAuth, async (req, res, next) => {
  try {
    const upline = await getUplineChain(req.user!.userId, db);
    res.json(upline);
  } catch (err) {
    next(err);
  }
});

// GET /api/network/downline
router.get('/downline', jwtAuth, async (req, res, next) => {
  try {
    const downline = await getDownlineTree(req.user!.userId, db);
    res.json(downline);
  } catch (err) {
    next(err);
  }
});

// GET /api/network/stats
router.get('/stats', jwtAuth, async (req, res, next) => {
  try {
    const stats = await getNetworkStats(req.user!.userId, db);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/network/payout-slots
// Returns the cycle-based payout receivers for the current user's cycle
// Uses the REFERRAL chain (user.referrerId pointers), not the tree path
router.get('/payout-slots', jwtAuth, async (req, res, next) => {
  try {
    const user = await db.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: { referrerId: true, cyclePosition: true },
    });

    // Show the user's OWN cycle position — this determines payouts when THEY refer someone
    const cyclePosition = user.cyclePosition ?? 1;

    const receivers = getCycleReceivers(cyclePosition);

    // Build referral upline chain (follow referrerId pointers, up to 9 levels)
    const uplineChain: string[] = [];
    let currentId: string | null = req.user!.userId;
    for (let i = 0; i < 9; i++) {
      const u: { referrerId: string | null } | null = await db.user.findUnique({
        where: { id: currentId! },
        select: { referrerId: true },
      });
      if (!u?.referrerId) break;
      uplineChain.push(u.referrerId);
      currentId = u.referrerId;
    }

    const slots = await Promise.all(
      receivers.map(async (receiver) => {
        if (receiver.type === 'SELF') {
          const self = await db.user.findUnique({
            where: { id: req.user!.userId },
            select: { memberId: true, name: true, sequenceNumber: true, level: true },
          });
          return self ? { ...self, levelDiff: 0, slotType: 'SELF', cycleSlot: cyclePosition } : null;
        }

        const level = receiver.levelOffset!;
        const uplineId = uplineChain[level - 1] ?? null;
        if (!uplineId) return { levelDiff: level, slotType: 'MISSING', cycleSlot: cyclePosition };

        const uplineUser = await db.user.findUnique({
          where: { id: uplineId },
          select: { memberId: true, name: true, sequenceNumber: true, level: true },
        });

        return uplineUser
          ? { ...uplineUser, levelDiff: level, slotType: 'UPLINE', cycleSlot: cyclePosition }
          : { levelDiff: level, slotType: 'MISSING', cycleSlot: cyclePosition };
      })
    );

    res.json({ cyclePosition, slots: slots.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

// GET /api/network/cycle-info — returns the user's current cycle and the full cycle table
router.get('/cycle-info', jwtAuth, async (req, res, next) => {
  try {
    const user = await db.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: { cyclePosition: true, memberId: true },
    });

    // Build the full cycle table dynamically for positions 1-9
    const cycleTable: Record<number, string[]> = {};
    for (let pos = 1; pos <= 9; pos++) {
      const l1 = pos;
      const l2 = (pos % 9) + 1;
      cycleTable[pos] = [
        'Self',
        `L${l1}${l1 === 1 ? ' (closest)' : l1 === 9 ? ' (farthest)' : ''}`,
        `L${l2}${l2 === 1 ? ' (closest)' : l2 === 9 ? ' (farthest)' : ''}`,
      ];
    }

    res.json({
      memberId: user.memberId,
      currentCycle: user.cyclePosition,
      cycleTable,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
