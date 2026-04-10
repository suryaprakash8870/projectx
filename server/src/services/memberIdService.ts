import { PrismaClient } from '@prisma/client';

/**
 * Generates the next sequential member ID.
 * Company users:  IND00001 – IND00512  (seeded, never called at runtime)
 * Real users:     IND00513, IND00514, ... (called on each new registration)
 */
export async function generateNextMemberId(
  db: PrismaClient
): Promise<{ memberId: string; sequenceNumber: number }> {
  // Atomic increment using a single-row sequence table
  const seq = await db.memberSequence.update({
    where: { id: 1 },
    data: { lastSequence: { increment: 1 } },
  });
  const memberId = `IND${String(seq.lastSequence).padStart(5, '0')}`;
  return { memberId, sequenceNumber: seq.lastSequence };
}

/**
 * Returns true if a sequenceNumber belongs to a pre-seeded company user.
 */
export function isCompanyUser(sequenceNumber: number): boolean {
  return sequenceNumber >= 1 && sequenceNumber <= 512;
}
