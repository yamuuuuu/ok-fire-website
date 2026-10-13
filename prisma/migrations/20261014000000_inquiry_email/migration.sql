CREATE TABLE "inquiry_emails" (
  "id" UUID NOT NULL,
  "inquiry_id" BIGINT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "first_attempt_at" TIMESTAMPTZ(3),
  "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lease_until" TIMESTAMPTZ(3),
  "sent_at" TIMESTAMPTZ(3),
  "provider_id" VARCHAR(255),
  "error_code" VARCHAR(100),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inquiry_emails_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inquiry_emails_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "inquiry_emails_inquiry_id_key" ON "inquiry_emails"("inquiry_id");
CREATE INDEX "inquiry_emails_status_next_attempt_at_idx" ON "inquiry_emails"("status", "next_attempt_at");
