import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { purchaseProduct } from '../services/walletService';

const productsRouter = Router();
const ordersRouter = Router();
const db = new PrismaClient();

// ── Products ────────────────────────────────────────────────────────────────

// GET /api/products — optionally filter by category
productsRouter.get('/', jwtAuth, async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId as string;

    const products = await db.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// POST /api/products — admin create
productsRouter.post('/', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, price, categoryId, couponSplitPct, imageUrl } = req.body;
    const product = await db.product.create({
      data: {
        name,
        description,
        price,
        categoryId: categoryId || null,
        couponSplitPct: couponSplitPct ?? 50,
        imageUrl,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id — admin update
productsRouter.put('/:id', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await db.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ── Orders ───────────────────────────────────────────────────────────────────

// POST /api/orders — place order
ordersRouter.post('/', jwtAuth, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      res.status(400).json({ error: 'VALIDATION', message: 'productId and quantity are required.' });
      return;
    }

    const order = await purchaseProduct(req.user!.userId, productId, quantity, db);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my — member order history
ordersRouter.get('/my', jwtAuth, async (req, res, next) => {
  try {
    const orders = await db.order.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: { select: { name: true, imageUrl: true, category: { select: { name: true } } } },
      },
      orderBy: { placedAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/all — admin view all orders
ordersRouter.get('/all', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const orders = await db.order.findMany({
      include: {
        user: { select: { memberId: true, name: true } },
        product: { select: { name: true, category: { select: { name: true } } } },
      },
      orderBy: { placedAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

export { productsRouter, ordersRouter };
