ALTER TABLE "upload_tickets" ALTER COLUMN "inquiry_id" DROP NOT NULL;
ALTER TABLE "upload_tickets" ADD COLUMN "work_case_id" BIGINT;
CREATE INDEX "upload_tickets_work_case_id_expires_at_idx" ON "upload_tickets"("work_case_id", "expires_at");
ALTER TABLE "upload_tickets" ADD CONSTRAINT "upload_tickets_work_case_id_fkey"
  FOREIGN KEY ("work_case_id") REFERENCES "work_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
