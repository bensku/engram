ALTER TABLE "message" ALTER COLUMN "source" DROP NOT NULL;
ALTER TABLE "message" ALTER COLUMN "text" DROP NOT NULL;
ALTER TABLE "message" ADD COLUMN "type" text NOT NULL;
ALTER TABLE "message" ADD COLUMN "toolData" jsonb;