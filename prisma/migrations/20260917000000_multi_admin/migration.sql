-- Replace the former single-admin guard with one active SUPER_ADMIN at a time.
DROP INDEX IF EXISTS "admins_singleton_key_key";
ALTER TABLE "admins" DROP COLUMN IF EXISTS "singleton_key";
CREATE UNIQUE INDEX "admins_one_super_admin_key"
  ON "admins" ("role")
  WHERE "role" = 'SUPER_ADMIN' AND "deleted_at" IS NULL;
