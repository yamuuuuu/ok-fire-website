import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
// Prisma's PostgreSQL timestamp conversion expects a UTC database session.
// Apply to every pooled connection, independently of the database/server timezone.
export function createPrismaClient(connectionString: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, options: '-c timezone=UTC', max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 }) });
}
