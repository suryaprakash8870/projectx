import { Router } from 'express';
import { db } from '../db';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// ── Categories ──────────────────────────────────────────────────────────────

// GET /api/vendor/categories — list all active categories
router.get('/categories', jwtAuth, async (_req, res, next) => {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { vendors: true, products: true } } },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/vendor/categories — admin creates a category
router.post('/categories', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'VALIDATION', message: 'Category name is required.' });
      return;
    }

    const existing = await db.category.findUnique({ where: { name } });
    if (existing) {
      res.status(409).json({ error: 'DUPLICATE', message: 'Category already exists.' });
      return;
    }

    const category = await db.category.create({ data: { name, description } });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// PUT /api/vendor/categories/:id — admin updates a category
router.put('/categories/:id', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const category = await db.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// ── Vendor Registration & Management ────────────────────────────────────────

// POST /api/vendor/register — user applies to become a vendor
router.post('/register', jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { businessName, categoryId, pinCode } = req.body;

    if (!businessName || !categoryId || !pinCode) {
      res.status(400).json({
        error: 'VALIDATION',
        message: 'businessName, categoryId, and pinCode are required.',
      });
      return;
    }

    // Check: one vendor per category per PIN
    const existingVendor = await db.vendor.findUnique({
      where: { categoryId_pinCode: { categoryId, pinCode } },
    });
    if (existingVendor) {
      res.status(409).json({
        error: 'SLOT_TAKEN',
        message: 'A vendor already exists for this category in this PIN code area.',
      });
      return;
    }

    // Check: user not already a vendor
    const userVendor = await db.vendor.findUnique({ where: { userId } });
    if (userVendor) {
      res.status(409).json({
        error: 'ALREADY_VENDOR',
        message: 'You are already registered as a vendor.',
      });
      return;
    }

    const vendor = await db.vendor.create({
      data: { userId, businessName, categoryId, pinCode },
    });

    res.status(201).json(vendor);
  } catch (err) {
    next(err);
  }
});

// GET /api/vendor/my — user views their own vendor profile
router.get('/my', jwtAuth, async (req, res, next) => {
  try {
    const vendor = await db.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { category: true },
    });
    res.json(vendor);
  } catch (err) {
    next(err);
  }
});

// GET /api/vendor/list — browse vendors by category and/or PIN
router.get('/list', jwtAuth, async (req, res, next) => {
  try {
    const { categoryId, pinCode, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { isApproved: true, isActive: true };
    if (categoryId) where.categoryId = categoryId as string;
    if (pinCode) where.pinCode = pinCode as string;

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          category: { select: { name: true } },
          user: { select: { memberId: true, name: true } },
        },
        skip,
        take: parseInt(limit as string),
      }),
      db.vendor.count({ where }),
    ]);

    res.json({
      vendors,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    next(err);
  }
});

// ── Admin Vendor Management ─────────────────────────────────────────────────

// GET /api/vendor/admin/all — admin views all vendor applications (paginated)
router.get('/admin/all', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status, page = '1' } = req.query;
    const where: any = {};
    // Support both legacy 'approved' param and new 'status' param
    if (status === 'APPROVED' || req.query.approved === 'true') where.isApproved = true;
    else if (status === 'PENDING' || req.query.approved === 'false') where.isApproved = false;
    else if (status === 'SUSPENDED') where.isActive = false;

    const limit = 20;
    const skip = (parseInt(page as string, 10) - 1) * limit;

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          category: { select: { name: true } },
          user: { select: { memberId: true, name: true, mobile: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.vendor.count({ where }),
    ]);

    // Map to frontend-expected shape
    const mapped = vendors.map(v => ({
      id: v.id,
      vendorId: v.user.memberId,
      name: v.businessName,
      email: v.user.email,
      category: v.category?.name || null,
      status: !v.isActive ? 'SUSPENDED' : v.isApproved ? 'APPROVED' : 'PENDING',
      createdAt: v.createdAt,
    }));

    res.json({ vendors: mapped, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// POST /api/vendor/admin/:id/approve — admin approves a vendor
router.post('/admin/:id/approve', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const vendor = await db.vendor.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });
    res.json({ message: 'Vendor approved.', vendor });
  } catch (err) {
    next(err);
  }
});

// POST /api/vendor/admin/:id/suspend — admin suspends a vendor
router.post('/admin/:id/suspend', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const vendor = await db.vendor.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Vendor suspended.', vendor });
  } catch (err) {
    next(err);
  }
});

// GET /api/vendor/check-slot — check if a category+PIN slot is available
router.get('/check-slot', jwtAuth, async (req, res, next) => {
  try {
    const { categoryId, pinCode } = req.query;
    if (!categoryId || !pinCode) {
      res.status(400).json({ error: 'VALIDATION', message: 'categoryId and pinCode are required.' });
      return;
    }

    const existing = await db.vendor.findUnique({
      where: {
        categoryId_pinCode: {
          categoryId: categoryId as string,
          pinCode: pinCode as string,
        },
      },
      select: {
        businessName: true,
        category: { select: { name: true } },
        user: { select: { memberId: true, name: true } },
      },
    });

    res.json({ available: !existing, existingVendor: existing ? { businessName: existing.businessName } : null });
  } catch (err) {
    next(err);
  }
});

export default router;
