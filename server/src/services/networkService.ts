import { PrismaClient } from '@prisma/client';

/**
 * Called when a new REAL user verifies their OTP.
 * Adds the user to the network tree under their referrer.
 * If referrerId is null, place under the last company user (IND000500).
 */
export async function addToNetwork(
  userId: string,
  referrerId: string | null,
  leg: string | null,
  db: PrismaClient
) {
  const effectiveReferrerId = referrerId ?? (await getLastRootUserId(db));
  let placementLeg = leg;

  if (!placementLeg) {
    placementLeg = 'LEFT';
  }

  /**
   * BFS Spillover Logic:
   * 1. Start at the referrer's chosen leg child (LEFT or RIGHT).
   * 2. If that slot is empty, place there directly.
   * 3. If occupied, do BFS within that subtree to find the first node
   *    missing a child — fill LEFT first, then RIGHT (level-order fill).
   *
   * Example with all LEFT referrals:
   *   1st → referrer.LEFT
   *   2nd → referrer.LEFT.RIGHT  (fills the pair)
   *   3rd → referrer.LEFT.LEFT.LEFT  (next level, leftmost empty)
   *   4th → referrer.LEFT.LEFT.RIGHT
   *   5th → referrer.LEFT.RIGHT.LEFT
   *   6th → referrer.LEFT.RIGHT.RIGHT
   *   ... continues level by level
   */

  // Check if the direct leg slot is available
  const directChild = await db.networkNode.findFirst({
    where: { parentId: effectiveReferrerId, position: placementLeg },
  });

  let placementParentId: string;
  let placementPosition: string;

  if (!directChild) {
    // Direct slot is open — place right there
    placementParentId = effectiveReferrerId;
    placementPosition = placementLeg;
  } else {
    // BFS within the subtree rooted at the direct child
    const subtreeRoot = directChild.userId;
    const queue: string[] = [subtreeRoot];
    let found = false;
    placementParentId = subtreeRoot;
    placementPosition = 'LEFT';

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await db.networkNode.findMany({
        where: { parentId: currentId },
        select: { userId: true, position: true },
      });

      const hasLeft = children.some((c) => c.position === 'LEFT');
      const hasRight = children.some((c) => c.position === 'RIGHT');

      if (!hasLeft) {
        placementParentId = currentId;
        placementPosition = 'LEFT';
        found = true;
        break;
      }
      if (!hasRight) {
        placementParentId = currentId;
        placementPosition = 'RIGHT';
        found = true;
        break;
      }

      // Both children exist — enqueue them in order (LEFT first for BFS)
      const leftChild = children.find((c) => c.position === 'LEFT');
      const rightChild = children.find((c) => c.position === 'RIGHT');
      if (leftChild) queue.push(leftChild.userId);
      if (rightChild) queue.push(rightChild.userId);
    }

    if (!found) {
      // Shouldn't happen in practice, but fallback
      placementParentId = subtreeRoot;
      placementPosition = 'LEFT';
    }
  }

  const parentNode = await db.networkNode.findUniqueOrThrow({
    where: { userId: placementParentId },
  });

  // Level = referrer's level + 1 (not tree parent's level)
  const referrer = await db.user.findUniqueOrThrow({
    where: { id: effectiveReferrerId },
    select: { level: true },
  });
  const userLevel = referrer.level + 1;

  await db.networkNode.create({
    data: {
      userId,
      parentId: placementParentId,
      position: placementPosition,
      level: parentNode.level + 1, // tree depth (internal, for path calculation)
      path: `${parentNode.path}.${userId}`,
    },
  });

  // Update the user's level (based on referrer, not tree depth)
  await db.user.update({
    where: { id: userId },
    data: { level: userLevel },
  });
}

async function getLastRootUserId(db: PrismaClient): Promise<string> {
  const user = await db.user.findFirstOrThrow({
    where: { sequenceNumber: { gte: 1, lte: 512 } },
    orderBy: { sequenceNumber: 'desc' },
    select: { id: true },
  });
  return user.id;
}

export async function getUplineChain(userId: string, db: PrismaClient) {
  const node = await db.networkNode.findUnique({ where: { userId } });
  if (!node) return [];
  const ancestorIds = node.path.split('.').slice(0, -1); // exclude self

  if (ancestorIds.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: ancestorIds } },
    select: {
      id: true,
      memberId: true,
      name: true,
      sequenceNumber: true,
      level: true,
      status: true,
    },
  });

  // Preserve order from path
  type UserRow = (typeof users)[number];
  return ancestorIds
    .map((id: string) => users.find((u: UserRow) => u.id === id))
    .filter((u: UserRow | undefined): u is UserRow => Boolean(u));
}

export async function getDownlineTree(userId: string, db: PrismaClient) {
  const node = await db.networkNode.findUnique({ where: { userId } });
  if (!node) return [];
  return db.networkNode.findMany({
    where: {
      path: { startsWith: `${node.path}.` },
    },
    include: {
      user: {
        select: {
          id: true,
          memberId: true,
          name: true,
          sequenceNumber: true,
          status: true,
          level: true,
        },
      },
    },
    orderBy: { level: 'asc' },
  });
}

export async function getNetworkStats(userId: string, db: PrismaClient) {
  const node = await db.networkNode.findUnique({
    where: { userId },
    include: { user: { select: { memberId: true, level: true } } },
  });

  if (!node) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { memberId: true } });
    return { memberId: user?.memberId || 'N/A', level: 0, direct: 0, total: 0, realDownlines: 0 };
  }

  // Direct referrals (children in tree)
  const directCount = await db.networkNode.count({
    where: { parentId: userId },
  });

  // Total downline — all descendants in this user's tree
  const totalDownline = await db.networkNode.count({
    where: {
      path: { startsWith: `${node.path}.` },
    },
  });

  return {
    memberId: node.user.memberId,
    level: node.user.level,
    direct: directCount,
    total: totalDownline,
    downlines: totalDownline,
  };
}
