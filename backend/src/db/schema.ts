import { relations } from 'drizzle-orm';
import {
  bigint,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ssoId: text('ssoId').notNull(),
});

export const topic = pgTable('topic', {
  id: serial('id').primaryKey(),
  user: integer('user').notNull(),
  title: text('title').notNull(),
  engine: text('engine').notNull(),
  options: jsonb('options').notNull().$type<Record<string, unknown>>(),
});

export const topicRelations = relations(topic, ({ many }) => ({
  messages: many(message),
}));

export const message = pgTable('message', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(),
  topic: integer('topic').notNull(),
  time: bigint('time', { mode: 'number' }).notNull(),
  source: text('source'),
  text: text('text'),
  toolData: jsonb('toolData'),
});

export const messageRelations = relations(message, ({ one }) => ({
  topic: one(topic),
}));
