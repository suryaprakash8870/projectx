import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient — prevents connection pool exhaustion.
// In dev (nodemon), the globalThis cache survives hot reloads so we
// don't leak connections on every file save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
