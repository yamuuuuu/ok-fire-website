import 'server-only';
import type { PrismaClient } from '@/generated/prisma/client';
import { createPrismaClient } from './prisma-client';
import { getEnv } from './env';
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function db() {
  if (!globalDb.prisma) globalDb.prisma = createPrismaClient(getEnv().DATABASE_URL);
  return globalDb.prisma;
}
