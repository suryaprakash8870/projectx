import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();
const db = new PrismaClient();

// GET /api/users/me
router.get('/me', jwtAuth, async (req, res, next) => {
  try {
    const user = await db.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: {
        id: true,
        memberId: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        status: true,
        level: true,
        cyclePosition: true,
        sequenceNumber: true,
        createdAt: true,
        referrer: { select: { memberId: true, name: true } },
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me
router.put('/me', jwtAuth, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await db.user.update({
      where: { id: req.user!.userId },
      data: { name, email },
      select: { id: true, memberId: true, name: true, email: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
