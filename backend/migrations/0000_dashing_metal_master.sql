CREATE TABLE IF NOT EXISTS "message" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" integer,
	"source" text,
	"text" text
);

CREATE TABLE IF NOT EXISTS "topic" (
	"id" serial PRIMARY KEY NOT NULL
);
