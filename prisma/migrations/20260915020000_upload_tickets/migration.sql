-- CreateTable
CREATE TABLE "upload_tickets" (
    "id" UUID NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "client_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "attachment_id" BIGINT,
    "rejected_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "upload_tickets_storage_key_key" ON "upload_tickets"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "upload_tickets_attachment_id_key" ON "upload_tickets"("attachment_id");

-- CreateIndex
CREATE INDEX "upload_tickets_inquiry_id_expires_at_idx" ON "upload_tickets"("inquiry_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "upload_tickets_inquiry_id_client_id_key" ON "upload_tickets"("inquiry_id", "client_id");

-- AddForeignKey
ALTER TABLE "upload_tickets" ADD CONSTRAINT "upload_tickets_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_tickets" ADD CONSTRAINT "upload_tickets_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "inquiry_attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
