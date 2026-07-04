-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'WORKER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('WATERING', 'FERTILIZER', 'PESTICIDE', 'WEEDING', 'PRUNING', 'HARVESTING', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_DUE', 'TASK_COMPLETED', 'TASK_MISSED', 'WEATHER_ALERT', 'MARKET_ALERT', 'AI_INSIGHT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'IMAGE', 'DOCUMENT', 'REPORT', 'INVOICE', 'AI_REPORT');

-- CreateEnum
CREATE TYPE "CropPhase" AS ENUM ('PREPARATION', 'SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVESTING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'signup',
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "soil_type" TEXT,
    "acreage" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_plots" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_z" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "size_width" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "size_depth" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "growth_stage" TEXT,
    "soil_moisture" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "nutrients" TEXT,
    "water_consumption" DOUBLE PRECISION,
    "health_score" DOUBLE PRECISION,
    "pest_risk" TEXT,
    "harvest_date" TIMESTAMP(3),
    "yield_estimate" TEXT,
    "irrigation_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_plans" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "crop_name" TEXT NOT NULL,
    "variety" TEXT,
    "area_ha" DOUBLE PRECISION,
    "expected_yield" DOUBLE PRECISION,
    "yield_unit" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "current_phase" "CropPhase" NOT NULL DEFAULT 'PREPARATION',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT,
    "farm_id" TEXT NOT NULL,
    "task_type" "TaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "completed_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "notes" TEXT,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "yield_impact" DOUBLE PRECISION,
    "recovery_action" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT,
    "storage_key" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "public_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "checksum" TEXT,
    "metadata" JSONB,
    "description" TEXT,
    "tags" TEXT[],
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_history" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "weather_code" INTEGER NOT NULL,
    "weather_description" TEXT NOT NULL,
    "precipitation" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_price_history" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT,
    "crop_name" TEXT NOT NULL,
    "market_type" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "price_per_kg" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "trend" TEXT,
    "unit" TEXT NOT NULL DEFAULT '₹/kg',
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_records" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "crop_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION,
    "harvest_date" TIMESTAMP(3) NOT NULL,
    "quality" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yield_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "plan_id" TEXT,
    "task_id" TEXT,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_actioned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autosave_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "data" JSONB NOT NULL,
    "is_partial" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autosave_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_token_idx" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_refresh_token_idx" ON "user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "otps_user_id_idx" ON "otps"("user_id");

-- CreateIndex
CREATE INDEX "otps_user_id_purpose_idx" ON "otps"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "farms_name_idx" ON "farms"("name");

-- CreateIndex
CREATE INDEX "farms_location_idx" ON "farms"("location");

-- CreateIndex
CREATE INDEX "farm_plots_farm_id_idx" ON "farm_plots"("farm_id");

-- CreateIndex
CREATE INDEX "farm_users_user_id_idx" ON "farm_users"("user_id");

-- CreateIndex
CREATE INDEX "farm_users_farm_id_idx" ON "farm_users"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "farm_users_user_id_farm_id_key" ON "farm_users"("user_id", "farm_id");

-- CreateIndex
CREATE INDEX "crop_plans_farm_id_idx" ON "crop_plans"("farm_id");

-- CreateIndex
CREATE INDEX "crop_plans_crop_name_idx" ON "crop_plans"("crop_name");

-- CreateIndex
CREATE INDEX "crop_plans_start_date_idx" ON "crop_plans"("start_date");

-- CreateIndex
CREATE INDEX "crop_plans_end_date_idx" ON "crop_plans"("end_date");

-- CreateIndex
CREATE INDEX "crop_plans_current_phase_idx" ON "crop_plans"("current_phase");

-- CreateIndex
CREATE INDEX "tasks_farm_id_idx" ON "tasks"("farm_id");

-- CreateIndex
CREATE INDEX "tasks_plan_id_idx" ON "tasks"("plan_id");

-- CreateIndex
CREATE INDEX "tasks_scheduled_date_idx" ON "tasks"("scheduled_date");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_task_type_idx" ON "tasks"("task_type");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_storage_key_key" ON "uploaded_files"("storage_key");

-- CreateIndex
CREATE INDEX "uploaded_files_user_id_idx" ON "uploaded_files"("user_id");

-- CreateIndex
CREATE INDEX "uploaded_files_farm_id_idx" ON "uploaded_files"("farm_id");

-- CreateIndex
CREATE INDEX "uploaded_files_file_type_idx" ON "uploaded_files"("file_type");

-- CreateIndex
CREATE INDEX "uploaded_files_uploaded_at_idx" ON "uploaded_files"("uploaded_at");

-- CreateIndex
CREATE INDEX "weather_history_farm_id_idx" ON "weather_history"("farm_id");

-- CreateIndex
CREATE INDEX "weather_history_location_idx" ON "weather_history"("location");

-- CreateIndex
CREATE INDEX "weather_history_recorded_at_idx" ON "weather_history"("recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "weather_history_farm_id_location_recorded_at_key" ON "weather_history"("farm_id", "location", "recorded_at");

-- CreateIndex
CREATE INDEX "market_price_history_farm_id_idx" ON "market_price_history"("farm_id");

-- CreateIndex
CREATE INDEX "market_price_history_crop_name_idx" ON "market_price_history"("crop_name");

-- CreateIndex
CREATE INDEX "market_price_history_market_type_idx" ON "market_price_history"("market_type");

-- CreateIndex
CREATE INDEX "market_price_history_market_idx" ON "market_price_history"("market");

-- CreateIndex
CREATE INDEX "market_price_history_recorded_at_idx" ON "market_price_history"("recorded_at");

-- CreateIndex
CREATE INDEX "yield_records_farm_id_idx" ON "yield_records"("farm_id");

-- CreateIndex
CREATE INDEX "yield_records_crop_name_idx" ON "yield_records"("crop_name");

-- CreateIndex
CREATE INDEX "yield_records_harvest_date_idx" ON "yield_records"("harvest_date");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_idx" ON "ai_insights"("user_id");

-- CreateIndex
CREATE INDEX "ai_insights_farm_id_idx" ON "ai_insights"("farm_id");

-- CreateIndex
CREATE INDEX "ai_insights_plan_id_idx" ON "ai_insights"("plan_id");

-- CreateIndex
CREATE INDEX "ai_insights_task_id_idx" ON "ai_insights"("task_id");

-- CreateIndex
CREATE INDEX "ai_insights_is_read_idx" ON "ai_insights"("is_read");

-- CreateIndex
CREATE INDEX "ai_insights_is_actioned_idx" ON "ai_insights"("is_actioned");

-- CreateIndex
CREATE INDEX "ai_insights_created_at_idx" ON "ai_insights"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "notifications"("sent_at");

-- CreateIndex
CREATE INDEX "autosave_drafts_user_id_idx" ON "autosave_drafts"("user_id");

-- CreateIndex
CREATE INDEX "autosave_drafts_entity_type_idx" ON "autosave_drafts"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "autosave_drafts_user_id_entity_type_entity_id_key" ON "autosave_drafts"("user_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "chat_sessions_device_id_idx" ON "chat_sessions"("device_id");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_plots" ADD CONSTRAINT "farm_plots_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_users" ADD CONSTRAINT "farm_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_users" ADD CONSTRAINT "farm_users_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_plans" ADD CONSTRAINT "crop_plans_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "crop_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_history" ADD CONSTRAINT "weather_history_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_price_history" ADD CONSTRAINT "market_price_history_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_records" ADD CONSTRAINT "yield_records_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "crop_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
