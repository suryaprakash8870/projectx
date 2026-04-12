import { PrismaClient } from '@prisma/client';

/**
 * Generates the next Plan 2 member ID.
 * Format: IND + first letter of name (uppercase) + last 3 digits of mobile + 4-digit global counter
 *   e.g. Ravi Kumar, 9876543210 → INDR2100001
 *        Second user: INDK5440002
 */
export async function generateNextPlan2MemberId(
  db: PrismaClient,
  name: string,
  mobile: string,
): Promise<{ memberId: string; sequenceNumber: number }> {
  const seq = await db.plan2Sequence.upsert({
    where: { id: 1 },
    create: { id: 1, lastSequence: 1 },
    update: { lastSequence: { increment: 1 } },
  });

  const firstLetter = (name.trim().charAt(0) || 'X').toUpperCase();
  const digits = mobile.replace(/\D/g, '');
  const last3 = digits.slice(-3).padStart(3, '0');
  const counter = String(seq.lastSequence).padStart(4, '0');
  const memberId = `IND${firstLetter}${last3}${counter}`;

  return { memberId, sequenceNumber: seq.lastSequence };
}
