import 'dotenv/config';
import { createPrismaClient } from '../src/lib/prisma-client';
import { hashPassword } from '../src/lib/password';
import { seedSchema } from '../src/validations/auth';
async function main() {
  const input = seedSchema.safeParse(process.env);
  if (!input.success || !process.env.DATABASE_URL) throw new Error('Set DATABASE_URL and valid SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (16–128 characters).');
  const client = createPrismaClient(process.env.DATABASE_URL);
  try {
    const values = input.data;
    const existing = await client.admin.findUnique({ where: { email: values.SEED_ADMIN_EMAIL } });
    if (existing) {
      if (existing.role !== 'SUPER_ADMIN' || existing.status !== 'ACTIVE' || existing.deletedAt) throw new Error('Existing account cannot be reused as the initial administrator. No account was changed.');
      console.log('Initial SUPER_ADMIN already exists; credentials left unchanged.'); return;
    }
    await client.$transaction(async tx => {
      const admin = await tx.admin.create({ data: { name: values.SEED_ADMIN_NAME, email: values.SEED_ADMIN_EMAIL, passwordHash: await hashPassword(values.SEED_ADMIN_PASSWORD), role: 'SUPER_ADMIN', status: 'ACTIVE' } });
      await tx.adminActivityLog.create({ data: { adminId: admin.id, actionType: 'ADMIN_SEEDED', targetType: 'ADMIN', targetId: admin.id } });
    });
    console.log('Initial SUPER_ADMIN created.');
  } finally { await client.$disconnect(); }
}
main().catch(() => { console.error('Seed failed. Check database access and seed inputs; existing accounts are never overwritten.'); process.exitCode = 1; });
