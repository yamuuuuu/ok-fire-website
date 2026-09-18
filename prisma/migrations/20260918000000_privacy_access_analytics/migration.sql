ALTER TABLE "admins" ADD COLUMN "customer_pii_access" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "public_page_view_daily" (
  "day" DATE NOT NULL,
  "path" VARCHAR(255) NOT NULL,
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_page_view_daily_pkey" PRIMARY KEY ("day", "path")
);

CREATE INDEX "public_page_view_daily_day_idx" ON "public_page_view_daily"("day");
