import { PrismaClient } from '@prisma/client';

export const MONTHLY_RETURN_PCT = 0.05;  // 5% to investor
export const REFERRAL_RETURN_PCT = 0.02; // 2% to direct referrer

/**
 * Distributes monthly + referral returns for a given month key (e.g. "2026-04").
 * - For each active investment: credit 5% × amount to the investor
 * - For each active investment: if the investor has a referrer, credit 2% × amount to the referrer
 *
 * Idempotent per monthKey (creates a Plan2ReturnRun; duplicate month raises an error).
 */
export async function distributeReturns(
  monthKey: string,
  adminId: string,
  db: PrismaClient,
) {
  // Prevent double-runs
  const existing = await db.plan2ReturnRun.findUnique({ where: { monthKey } });
  if (existing) throw new Error('MONTH_ALREADY_PROCESSED');

  return db.$transaction(async (tx) => {
    // Fetch all active investments with the investor info
    const investments = await tx.plan2Investment.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, referrerId: true } },
      },
    });

    let totalMonthly = 0;
    let totalReferral = 0;
    const investorsPaid = new Set<string>();
    const referrersPaid = new Set<string>();

    const run = await tx.plan2ReturnRun.create({
      data: { monthKey, runBy: adminId },
    });

    for (const inv of investments) {
      const monthlyAmount = Math.floor(inv.amount * MONTHLY_RETURN_PCT);

      // Credit the investor
      const investorWallet = await tx.plan2Wallet.findUniqueOrThrow({
        where: { userId: inv.userId },
      });
      await tx.plan2Wallet.update({
        where: { userId: inv.userId },
        data: { incomeBalance: { increment: monthlyAmount } },
      });
      await tx.plan2WalletTransaction.create({
        data: {
          walletId: investorWallet.id,
          type: 'CREDIT',
          source: 'MONTHLY_RETURN',
          amount: monthlyAmount,
          monthKey,
          investmentId: inv.id,
          note: `Monthly return 5% on ₹${inv.amount}`,
        },
      });
      await tx.plan2ReturnPayout.create({
        data: {
          runId: run.id,
          recipientId: inv.userId,
          kind: 'MONTHLY_RETURN',
          amount: monthlyAmount,
          sourceInvestmentId: inv.id,
          sourceUserId: inv.userId,
          monthKey,
        },
      });
      totalMonthly += monthlyAmount;
      investorsPaid.add(inv.userId);

      // If referrer exists, credit them too
      if (inv.user.referrerId) {
        const refAmount = Math.floor(inv.amount * REFERRAL_RETURN_PCT);
        const refWallet = await tx.plan2Wallet.findUniqueOrThrow({
          where: { userId: inv.user.referrerId },
        });
        await tx.plan2Wallet.update({
          where: { userId: inv.user.referrerId },
          data: { incomeBalance: { increment: refAmount } },
        });
        await tx.plan2WalletTransaction.create({
          data: {
            walletId: refWallet.id,
            type: 'CREDIT',
            source: 'REFERRAL_RETURN',
            amount: refAmount,
            monthKey,
            investmentId: inv.id,
            note: `Referral 2% on ₹${inv.amount} (from investor)`,
          },
        });
        await tx.plan2ReturnPayout.create({
          data: {
            runId: run.id,
            recipientId: inv.user.referrerId,
            kind: 'REFERRAL_RETURN',
            amount: refAmount,
            sourceInvestmentId: inv.id,
            sourceUserId: inv.userId,
            monthKey,
          },
        });
        totalReferral += refAmount;
        referrersPaid.add(inv.user.referrerId);
      }
    }

    // Update run totals
    await tx.plan2ReturnRun.update({
      where: { id: run.id },
      data: {
        totalMonthlyCredit: totalMonthly,
        totalReferralCredit: totalReferral,
        totalInvestorsPaid: investorsPaid.size,
        totalReferrersPaid: referrersPaid.size,
      },
    });

    return {
      monthKey,
      totalMonthly,
      totalReferral,
      investorsPaid: investorsPaid.size,
      referrersPaid: referrersPaid.size,
    };
  });
}
