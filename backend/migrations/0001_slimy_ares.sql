CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL
);

ALTER TABLE "message" ALTER COLUMN "topic" SET NOT NULL;
ALTER TABLE "message" ALTER COLUMN "source" SET NOT NULL;
ALTER TABLE "message" ALTER COLUMN "text" SET NOT NULL;
ALTER TABLE "message" ADD COLUMN "time" integer NOT NULL;
ALTER TABLE "topic" ADD COLUMN "user" integer NOT NULL;
ALTER TABLE "topic" ADD COLUMN "title" text NOT NULL;