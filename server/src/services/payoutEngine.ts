import { PrismaClient } from '@prisma/client';

export const PAYOUT_PER_SLOT = 250;
export const GST_AMOUNT      = 180;
export const COMPANY_FEE     = 70;
export const JOIN_FEE        = 1000;

/**
 * Cycle-based referral payout system.
 *
 * Every referrer tracks a cyclePosition (1–9) that determines which pair
 * of their upline levels gets paid when they bring in a new member.
 *
 * cyclePosition n → pays Self + L(n) + L(n%9+1)
 *
 * Upline levels follow the REFERRAL chain (user.referrerId pointers):
 *   L1 = referrer's referrer, L2 = L1's referrer, … L9 = farthest.
 *
 * Starting state: cyclePosition = 1 for all users.
 *
 * Full referral sequence (starting from pointer=1):
 *   Ref 1: Self + L1 + L2  → pointer becomes 3
 *   Ref 2: Self + L3 + L4  → pointer becomes 5
 *   Ref 3: Self + L5 + L6  → pointer becomes 7
 *   Ref 4: Self + L7 + L8  → pointer becomes 9
 *   Ref 5: Self + L9 + L1  → pointer becomes 2 (wraps)
 *   Ref 6: Self + L2 + L3  → pointer becomes 4
 *   Ref 7: Self + L4 + L5  → pointer becomes 6
 *   Ref 8: Self + L6 + L7  → pointer becomes 8
 *   Ref 9: Self + L8 + L9  → pointer becomes 1 (full cycle)
 *
 * ₹250 per receiver × 3 = ₹750 per referral.
 * If an upline position doesn't exist, that ₹250 goes to Company wallet.
 * If there is no referrer at all, all 3 slots go to Company wallet.
 * Every upline level gets paid evenly over a full 9-referral rotation.
 */

/**
 * Gets the payout receivers for a given cycle position (1–9).
 *   → Self + L(n) + L(wrap(n+1))
 */
export function getCycleReceivers(cyclePosition: number): Array<{ type: 'UPLINE' | 'SELF'; levelOffset?: number }> {
  if (cyclePosition < 1 || cyclePosition > 9) {
    throw new Error(`Invalid cycle position: ${cyclePosition}`);
  }
  const level1 = cyclePosition;
  const level2 = (cyclePosition % 9) + 1; // wraps: 9→1, 1→2, 4→5, etc.
  return [
    { type: 'SELF' },
    { type: 'UPLINE', levelOffset: level1 },
    { type: 'UPLINE', levelOffset: level2 },
  ];
}

/**
 * Advances the referrer's cycle pointer by 2 (wrapping mod 9).
 * Sequence: 1→3→5→7→9→2→4→6→8→1
 */
export function getNextCyclePosition(current: number): number {
  if (current < 1 || current > 9) return 1; // safe default
  return ((current - 1 + 2) % 9) + 1;
}

/**
 * Traverse the REFERRAL chain from a user upwards.
 * Returns [L1, L2, …, L(maxLevels)] where:
 *   L1 = userId's referrer (direct parent in referral chain)
 *   L2 = L1's referrer, etc.
 */
async function getReferralUplineChain(
  userId: string,
  maxLevels: number,
  tx: any,
): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = userId;
  for (let i = 0; i < maxLevels; i++) {
    const user: { referrerId: string | null } | null = await tx.user.findUnique({
      where: { id: currentId! },
      select: { referrerId: true },
    });
    if (!user?.referrerId) break;
    chain.push(user.referrerId);
    currentId = user.referrerId;
  }
  return chain;
}

/**
 * Main payout processor.
 * Called when admin approves a joining request.
 *
 * Uses the REFERRER's referral chain (not tree path) for upline resolution.
 * Self = the referrer who brought in the joiner.
 * L1–L9 = referrer's ancestors via referrerId pointers.
 *
 * If no referrer (e.g. founder / admin-created user), all 3 × ₹250 go to
 * the company wallet (root user sequenceNumber=1).
 */
export async function processJoiningPayout(
  requestId: string,
  joinerId: string,
  db: PrismaClient,
) {
  // 1. Idempotency check
  const existing = await db.payoutRecord.findFirst({ where: { requestId } });
  if (existing) throw new Error('ALREADY_PROCESSED');

  // 2. Get joiner's direct referrer
  const joiner = await db.user.findUniqueOrThrow({
    where: { id: joinerId },
    select: { referrerId: true },
  });
  const referrerId = joiner.referrerId;

  // 3. Find admin user for company-fallback wallet
  //    Missing upline slots pay into ADMIN001's income wallet (the "Referral Income Wallet")
  const adminUser = await db.user.findFirstOrThrow({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  // 4. Atomic transaction — 30 s timeout to cover multiple sequential queries
  await db.$transaction(async (tx) => {
    // ── Determine payout recipients ─────────────────────────────────
    type Slot = { recipientId: string; levelDiff: number; note: string };
    const slots: Slot[] = [];
    let referrerCyclePosition = 0; // only used for recording

    if (!referrerId) {
      // No referrer → all 3 slots to company (admin's referral income wallet)
      for (let i = 0; i < 3; i++) {
        slots.push({
          recipientId: adminUser.id,
          levelDiff: 0,
          note: 'No referrer – company revenue',
        });
      }
    } else {
      // Read referrer's cycle position INSIDE the transaction (prevents stale reads)
      const referrer = await tx.user.findUniqueOrThrow({
        where: { id: referrerId },
        select: { cyclePosition: true },
      });
      referrerCyclePosition = referrer.cyclePosition;

      // Get referrer's upline chain via referral pointers (up to 9 levels)
      const uplineChain = await getReferralUplineChain(referrerId, 9, tx);

      // Resolve the 3 payout slots from the cycle
      const receivers = getCycleReceivers(referrerCyclePosition);
      for (const receiver of receivers) {
        if (receiver.type === 'SELF') {
          slots.push({
            recipientId: referrerId,
            levelDiff: 0,
            note: `Self-earning from cycle ${referrerCyclePosition}`,
          });
        } else {
          const level = receiver.levelOffset!;
          const uplineId = uplineChain[level - 1] ?? null;
          slots.push({
            recipientId: uplineId || adminUser.id,
            levelDiff: level,
            note: uplineId
              ? `Referral bonus (L${level}) cycle ${referrerCyclePosition}`
              : `Missing upline L${level} – company revenue`,
          });
        }
      }
    }

    // ── Process payout slots ─────────────────────────────────────────
    for (const slot of slots) {
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId: slot.recipientId },
      });

      await tx.wallet.update({
        where: { userId: slot.recipientId },
        data: { incomeBalance: { increment: PAYOUT_PER_SLOT } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          field: 'INCOME',
          amount: PAYOUT_PER_SLOT,
          note: slot.note,
          sourceRef: requestId,
        },
      });

      await tx.payoutRecord.create({
        data: {
          requestId,
          joinerId,
          recipientId: slot.recipientId,
          levelDiff: slot.levelDiff,
          cycleSlot: referrerCyclePosition,
          amount: PAYOUT_PER_SLOT,
        },
      });
    }

    // ── Credit ₹1000 coupon to joiner's coupon wallet ────────────────
    const joinerWallet = await tx.wallet.findUniqueOrThrow({
      where: { userId: joinerId },
    });
    await tx.wallet.update({
      where: { userId: joinerId },
      data: { couponBalance: { increment: JOIN_FEE } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: joinerWallet.id,
        type: 'CREDIT',
        field: 'COUPON',
        amount: JOIN_FEE,
        note: 'Joining coupon credit (₹1000)',
        sourceRef: requestId,
      },
    });

    // Record GST (ledger) + credit ₹180 to admin's gstBalance wallet
    await tx.gstRecord.create({ data: { requestId, amount: GST_AMOUNT } });

    const adminWallet = await tx.wallet.findUniqueOrThrow({
      where: { userId: adminUser.id },
    });
    await tx.wallet.update({
      where: { userId: adminUser.id },
      data: {
        gstBalance: { increment: GST_AMOUNT },
        incomeBalance: { increment: COMPANY_FEE },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: adminWallet.id,
        type: 'CREDIT',
        field: 'GST',
        amount: GST_AMOUNT,
        note: `GST 18% from joining (₹${GST_AMOUNT})`,
        sourceRef: requestId,
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: adminWallet.id,
        type: 'CREDIT',
        field: 'INCOME',
        amount: COMPANY_FEE,
        note: `Platform fee from joining (₹${COMPANY_FEE})`,
        sourceRef: requestId,
      },
    });

    // Also record the ₹70 platform fee as a PayoutRecord so it shows up
    // in the admin Payout Log. Convention: levelDiff = -1, cycleSlot = 0.
    await tx.payoutRecord.create({
      data: {
        requestId,
        joinerId,
        recipientId: adminUser.id,
        levelDiff: -1,
        cycleSlot: 0,
        amount: COMPANY_FEE,
      },
    });

    // Activate user
    await tx.user.update({
      where: { id: joinerId },
      data: { status: 'ACTIVE' },
    });

    // Mark request approved
    await tx.joiningRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });

    // Advance referrer's cycle position (inside tx — atomic with the read)
    if (referrerId) {
      const nextCycle = getNextCyclePosition(referrerCyclePosition);
      await tx.user.update({
        where: { id: referrerId },
        data: { cyclePosition: nextCycle },
      });
    }
  }, { timeout: 30000 });
}
