-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('FIRE_ELECTRIC', 'FIRE_CONSTRUCTION', 'FIRE_INSPECTION', 'REPAIR', 'ESTIMATE', 'ETC');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONFIRMED', 'CONSULTING', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'ESTIMATING', 'WORKING', 'COMPLETED', 'ON_HOLD', 'CANCELED');

-- CreateEnum
CREATE TYPE "PreferredContactTime" AS ENUM ('ANYTIME', 'MORNING', 'AFTERNOON', 'CUSTOM');

-- CreateEnum
CREATE TYPE "UploaderType" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('CUSTOMER', 'BEFORE', 'WORKING', 'AFTER', 'ESTIMATE', 'ETC');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkImageType" AS ENUM ('BEFORE', 'WORKING', 'AFTER');

-- CreateTable
CREATE TABLE "admins" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "AdminRole" NOT NULL DEFAULT 'MANAGER',
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_number" VARCHAR(30) NOT NULL,
    "customer_name" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "company_name" VARCHAR(100),
    "postal_code" VARCHAR(10),
    "address" VARCHAR(255) NOT NULL,
    "address_detail" VARCHAR(255),
    "inquiry_type" "InquiryType" NOT NULL,
    "description" TEXT NOT NULL,
    "preferred_contact_time" "PreferredContactTime",
    "preferred_contact_detail" VARCHAR(100),
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assigned_admin_id" BIGINT,
    "privacy_agreed" BOOLEAN NOT NULL,
    "privacy_agreed_at" TIMESTAMPTZ(3) NOT NULL,
    "source" VARCHAR(30) NOT NULL DEFAULT 'WEB',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_attachments" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "uploaded_by_admin_id" BIGINT,
    "uploader_type" "UploaderType" NOT NULL,
    "attachment_type" "AttachmentType" NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "estimate_id" BIGINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "inquiry_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_notes" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "inquiry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_status_histories" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "previous_status" "InquiryStatus",
    "new_status" "InquiryStatus" NOT NULL,
    "changed_by_admin_id" BIGINT,
    "memo" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_assignment_histories" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "previous_admin_id" BIGINT,
    "new_admin_id" BIGINT,
    "changed_by_admin_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_assignment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "assigned_admin_id" BIGINT,
    "visit_date" DATE NOT NULL,
    "visit_time" TIME(0),
    "address" VARCHAR(255) NOT NULL,
    "address_detail" VARCHAR(255),
    "memo" TEXT,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_by_admin_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" BIGSERIAL NOT NULL,
    "inquiry_id" BIGINT NOT NULL,
    "amount" DECIMAL(15,2),
    "memo" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_admin_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_cases" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "category" "InquiryType" NOT NULL,
    "location" VARCHAR(100),
    "building_type" VARCHAR(50),
    "work_date" DATE,
    "summary" VARCHAR(500),
    "description" TEXT NOT NULL,
    "thumbnail_storage_key" VARCHAR(500),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(3),
    "created_by_admin_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "work_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_case_images" (
    "id" BIGSERIAL NOT NULL,
    "work_case_id" BIGINT NOT NULL,
    "image_type" "WorkImageType" NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "work_case_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" BIGSERIAL NOT NULL,
    "category" VARCHAR(30),
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_by_admin_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" BIGSERIAL NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "value_type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255),
    "updated_by_admin_id" BIGINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT,
    "action_type" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" BIGINT,
    "metadata" JSONB,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" BIGSERIAL NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_rate_limits" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_inquiry_number_key" ON "inquiries"("inquiry_number");

-- CreateIndex
CREATE INDEX "inquiries_assigned_admin_id_idx" ON "inquiries"("assigned_admin_id");

-- CreateIndex
CREATE INDEX "inquiries_phone_idx" ON "inquiries"("phone");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at");

-- CreateIndex
CREATE INDEX "inquiries_inquiry_type_idx" ON "inquiries"("inquiry_type");

-- CreateIndex
CREATE INDEX "inquiries_status_created_at_idx" ON "inquiries"("status", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_assigned_admin_id_status_idx" ON "inquiries"("assigned_admin_id", "status");

-- CreateIndex
CREATE INDEX "inquiry_attachments_inquiry_id_idx" ON "inquiry_attachments"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_attachments_uploaded_by_admin_id_idx" ON "inquiry_attachments"("uploaded_by_admin_id");

-- CreateIndex
CREATE INDEX "inquiry_attachments_estimate_id_idx" ON "inquiry_attachments"("estimate_id");

-- CreateIndex
CREATE INDEX "inquiry_notes_inquiry_id_idx" ON "inquiry_notes"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_notes_admin_id_idx" ON "inquiry_notes"("admin_id");

-- CreateIndex
CREATE INDEX "inquiry_notes_inquiry_id_created_at_idx" ON "inquiry_notes"("inquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "inquiry_status_histories_inquiry_id_idx" ON "inquiry_status_histories"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_status_histories_changed_by_admin_id_idx" ON "inquiry_status_histories"("changed_by_admin_id");

-- CreateIndex
CREATE INDEX "inquiry_status_histories_inquiry_id_created_at_idx" ON "inquiry_status_histories"("inquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "inquiry_assignment_histories_inquiry_id_idx" ON "inquiry_assignment_histories"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_assignment_histories_previous_admin_id_idx" ON "inquiry_assignment_histories"("previous_admin_id");

-- CreateIndex
CREATE INDEX "inquiry_assignment_histories_new_admin_id_idx" ON "inquiry_assignment_histories"("new_admin_id");

-- CreateIndex
CREATE INDEX "inquiry_assignment_histories_changed_by_admin_id_idx" ON "inquiry_assignment_histories"("changed_by_admin_id");

-- CreateIndex
CREATE INDEX "visits_inquiry_id_idx" ON "visits"("inquiry_id");

-- CreateIndex
CREATE INDEX "visits_assigned_admin_id_idx" ON "visits"("assigned_admin_id");

-- CreateIndex
CREATE INDEX "visits_created_by_admin_id_idx" ON "visits"("created_by_admin_id");

-- CreateIndex
CREATE INDEX "visits_visit_date_idx" ON "visits"("visit_date");

-- CreateIndex
CREATE INDEX "visits_assigned_admin_id_visit_date_idx" ON "visits"("assigned_admin_id", "visit_date");

-- CreateIndex
CREATE INDEX "estimates_inquiry_id_idx" ON "estimates"("inquiry_id");

-- CreateIndex
CREATE INDEX "estimates_created_by_admin_id_idx" ON "estimates"("created_by_admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_cases_slug_key" ON "work_cases"("slug");

-- CreateIndex
CREATE INDEX "work_cases_created_by_admin_id_idx" ON "work_cases"("created_by_admin_id");

-- CreateIndex
CREATE INDEX "work_cases_published_published_at_idx" ON "work_cases"("published", "published_at");

-- CreateIndex
CREATE INDEX "work_cases_category_idx" ON "work_cases"("category");

-- CreateIndex
CREATE INDEX "work_case_images_work_case_id_idx" ON "work_case_images"("work_case_id");

-- CreateIndex
CREATE INDEX "faqs_created_by_admin_id_idx" ON "faqs"("created_by_admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_setting_key_key" ON "site_settings"("setting_key");

-- CreateIndex
CREATE INDEX "site_settings_updated_by_admin_id_idx" ON "site_settings"("updated_by_admin_id");

-- CreateIndex
CREATE INDEX "admin_activity_logs_admin_id_idx" ON "admin_activity_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_activity_logs_admin_id_created_at_idx" ON "admin_activity_logs"("admin_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "auth_rate_limits_expires_at_idx" ON "auth_rate_limits"("expires_at");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_uploaded_by_admin_id_fkey" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_status_histories" ADD CONSTRAINT "inquiry_status_histories_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_status_histories" ADD CONSTRAINT "inquiry_status_histories_changed_by_admin_id_fkey" FOREIGN KEY ("changed_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_assignment_histories" ADD CONSTRAINT "inquiry_assignment_histories_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_assignment_histories" ADD CONSTRAINT "inquiry_assignment_histories_previous_admin_id_fkey" FOREIGN KEY ("previous_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_assignment_histories" ADD CONSTRAINT "inquiry_assignment_histories_new_admin_id_fkey" FOREIGN KEY ("new_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_assignment_histories" ADD CONSTRAINT "inquiry_assignment_histories_changed_by_admin_id_fkey" FOREIGN KEY ("changed_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_cases" ADD CONSTRAINT "work_cases_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_case_images" ADD CONSTRAINT "work_case_images_work_case_id_fkey" FOREIGN KEY ("work_case_id") REFERENCES "work_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
