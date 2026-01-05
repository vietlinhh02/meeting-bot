-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "autopay_amount_to_purchase_cents" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "autopay_charge_failure_data" JSONB,
ADD COLUMN     "autopay_charge_task_enqueued_at" TIMESTAMP(3),
ADD COLUMN     "autopay_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autopay_stripe_customer_id" TEXT,
ADD COLUMN     "autopay_threshold_centricredits" INTEGER NOT NULL DEFAULT 1000;
