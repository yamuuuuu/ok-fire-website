ALTER TABLE "upload_tickets" ADD COLUMN "attachment_type" "AttachmentType" NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE "upload_tickets" ADD COLUMN "created_by_admin_id" BIGINT;
ALTER TABLE "upload_tickets" ADD COLUMN "estimate_id" BIGINT;

CREATE INDEX "upload_tickets_created_by_admin_id_idx" ON "upload_tickets"("created_by_admin_id");
CREATE INDEX "upload_tickets_estimate_id_idx" ON "upload_tickets"("estimate_id");

ALTER TABLE "upload_tickets" ADD CONSTRAINT "upload_tickets_created_by_admin_id_fkey"
  FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "upload_tickets" ADD CONSTRAINT "upload_tickets_estimate_id_fkey"
  FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
