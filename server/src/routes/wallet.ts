import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth';
import { getWalletWithTransactions, transferPurchaseToIncome } from '../services/walletService';

const router = Router();
const db = new PrismaClient();

// GET /api/wallet — all 4 wallet balances
router.get('/', jwtAuth, async (req, res, next) => {
  try {
    const wallet = await db.wallet.findUnique({
      where: { userId: req.user!.userId },
      select: {
        couponBalance: true,
        purchaseBalance: true,
        incomeBalance: true,
        gstBalance: true,
        updatedAt: true,
      },
    });
    if (!wallet) {
      res.json({ couponBalance: 0, purchaseBalance: 0, incomeBalance: 0, gstBalance: 0, updatedAt: null });
      return;
    }
    res.json(wallet);
  } catch (err) {
    next(err);
  }
});

// GET /api/wallet/transactions — paginated history with optional field filter
router.get('/transactions', jwtAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getWalletWithTransactions(req.user!.userId, page, limit, db);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/wallet/transfer — transfer from Purchase Wallet → Income Wallet
router.post('/transfer', jwtAuth, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'VALIDATION', message: 'A positive amount is required.' });
      return;
    }

    const result = await transferPurchaseToIncome(req.user!.userId, amount, db);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
