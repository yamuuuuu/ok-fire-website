-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "preferred_work_date" DATE,
ADD COLUMN     "privacy_policy_version" VARCHAR(100),
ADD COLUMN     "submission_key_hash" VARCHAR(64),
ADD COLUMN     "submission_payload_hash" VARCHAR(64);

-- CreateTable
CREATE TABLE "inquiry_counters" (
    "day" VARCHAR(8) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "inquiry_counters_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "public_rate_limits" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "public_rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "public_rate_limits_expires_at_idx" ON "public_rate_limits"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_submission_key_hash_key" ON "inquiries"("submission_key_hash");
