import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { processJoiningPayout } from '../services/payoutEngine';

const router = Router();
const db = new PrismaClient();

// POST /api/joining/request — member submits joining request
router.post('/request', jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    // Check if already have a request
    const existing = await db.joiningRequest.findUnique({ where: { userId } });
    if (existing) throw new Error('JOINING_REQUEST_EXISTS');

    const request = await db.joiningRequest.create({
      data: { userId, amount: 1000 },
    });

    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { memberId: true },
    });

    res.status(201).json({ ...request, memberId: user.memberId });
  } catch (err) {
    next(err);
  }
});

// GET /api/joining/my — member views own request
router.get('/my', jwtAuth, async (req, res, next) => {
  try {
    const request = await db.joiningRequest.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { memberId: true, name: true } } },
    });
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// GET /api/joining/all — admin views all requests
router.get('/all', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const requests = await db.joiningRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: {
            memberId: true,
            name: true,
            mobile: true,
            referrer: { select: { memberId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// POST /api/joining/:id/approve — admin approves → triggers payout
router.post('/:id/approve', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const request = await db.joiningRequest.findUniqueOrThrow({
      where: { id: req.params.id },
    });

    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'NOT_PENDING', message: 'Request is not in PENDING state.' });
      return;
    }

    await processJoiningPayout(request.id, request.userId, db);

    res.json({ message: 'Joining approved and payouts processed.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/joining/:id/reject — admin rejects
router.post('/:id/reject', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { note } = req.body;
    const request = await db.joiningRequest.findUniqueOrThrow({
      where: { id: req.params.id },
    });

    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'NOT_PENDING', message: 'Request is not in PENDING state.' });
      return;
    }

    await db.joiningRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', note: note || 'Rejected by admin' },
    });

    res.json({ message: 'Joining request rejected.' });
  } catch (err) {
    next(err);
  }
});

export default router;
