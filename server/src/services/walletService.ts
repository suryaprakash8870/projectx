import { PrismaClient } from '@prisma/client';

const CASHBACK_PERCENT = 2.5;

/**
 * Purchase a product using coupon + income wallets.
 * Coupon wallet usage capped at 50% of product price.
 * 2.5% cashback credited to purchase wallet.
 * Revenue split: 10% platform fee → 18% GST, 30% company, rest to users.
 */
export async function purchaseProduct(
  userId: string,
  productId: string,
  qty: number,
  db: PrismaClient
) {
  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  if (!product.isActive) throw new Error('PRODUCT_NOT_AVAILABLE');

  const total = product.price * qty;
  const maxCoupon = Math.floor(total * product.couponSplitPct / 100); // 50% max coupon usage
  const cashPart = total - maxCoupon;
  const cashback = Math.floor(total * CASHBACK_PERCENT / 100); // 2.5% cashback

  // Platform revenue split (10% platform fee)
  const platformFee = Math.floor(total * 10 / 100);
  const gstFromFee = Math.floor(platformFee * 18 / 100);
  const companyFromFee = Math.floor(platformFee * 30 / 100);
  const userFromFee = platformFee - gstFromFee - companyFromFee;

  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId } });
  if (wallet.couponBalance < maxCoupon) throw new Error('INSUFFICIENT_COUPON');
  if (wallet.incomeBalance < cashPart) throw new Error('INSUFFICIENT_INCOME');

  return db.$transaction(async (tx) => {
    // Deduct from wallets
    await tx.wallet.update({
      where: { userId },
      data: {
        couponBalance: { decrement: maxCoupon },
        incomeBalance: { decrement: cashPart },
        purchaseBalance: { increment: cashback }, // 2.5% cashback to purchase wallet
      },
    });

    const order = await tx.order.create({
      data: {
        userId,
        productId,
        quantity: qty,
        totalAmount: total,
        cashPaid: cashPart,
        couponUsed: maxCoupon,
        cashback,
      },
    });

    // Record wallet transactions
    await tx.walletTransaction.createMany({
      data: [
        {
          walletId: wallet.id,
          type: 'DEBIT',
          field: 'COUPON',
          amount: maxCoupon,
          note: `Purchase: ${product.name}`,
          sourceRef: order.id,
        },
        {
          walletId: wallet.id,
          type: 'DEBIT',
          field: 'INCOME',
          amount: cashPart,
          note: `Purchase: ${product.name}`,
          sourceRef: order.id,
        },
        {
          walletId: wallet.id,
          type: 'CREDIT',
          field: 'PURCHASE',
          amount: cashback,
          note: `2.5% cashback on purchase: ${product.name}`,
          sourceRef: order.id,
        },
      ],
    });

    // Record revenue split
    await tx.revenueSplit.create({
      data: {
        orderId: order.id,
        totalAmount: total,
        platformFee,
        gstAmount: gstFromFee,
        companyAmount: companyFromFee,
        userAmount: userFromFee,
      },
    });

    return order;
  });
}

/**
 * Transfer balance from Purchase Wallet → Income Wallet.
 * Allows the user to make cashback earnings withdrawable.
 */
export async function transferPurchaseToIncome(
  userId: string,
  amount: number,
  db: PrismaClient
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');

  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId } });
  if (wallet.purchaseBalance < amount) throw new Error('INSUFFICIENT_PURCHASE_BALANCE');

  return db.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId },
      data: {
        purchaseBalance: { decrement: amount },
        incomeBalance: { increment: amount },
      },
    });

    await tx.walletTransaction.createMany({
      data: [
        {
          walletId: wallet.id,
          type: 'DEBIT',
          field: 'PURCHASE',
          amount,
          note: 'Transfer to Income Wallet',
        },
        {
          walletId: wallet.id,
          type: 'CREDIT',
          field: 'INCOME',
          amount,
          note: 'Transfer from Purchase Wallet',
        },
      ],
    });

    return { success: true, transferred: amount };
  });
}

/**
 * Get wallet details with paginated transactions.
 */
export async function getWalletWithTransactions(
  userId: string,
  page: number,
  limit: number,
  db: PrismaClient
) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return {
      couponBalance: 0,
      purchaseBalance: 0,
      incomeBalance: 0,
      gstBalance: 0,
      transactions: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    couponBalance: wallet.couponBalance,
    purchaseBalance: wallet.purchaseBalance,
    incomeBalance: wallet.incomeBalance,
    gstBalance: wallet.gstBalance,
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
