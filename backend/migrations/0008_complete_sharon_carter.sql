ALTER TABLE "message" ADD COLUMN "content" jsonb NOT NULL;
ALTER TABLE "message" DROP COLUMN IF EXISTS "text";