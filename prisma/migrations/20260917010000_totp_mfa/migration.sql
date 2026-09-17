ALTER TABLE "admins" ADD COLUMN "totp_secret" VARCHAR(255);
ALTER TABLE "admins" ADD COLUMN "totp_enabled_at" TIMESTAMPTZ(3);
