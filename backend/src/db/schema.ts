import { relations } from 'drizzle-orm';
import { bigint, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
});

export const topic = pgTable('topic', {
  id: serial('id').primaryKey(),
  user: integer('user').notNull(),
  title: text('title').notNull(),
  engine: text('engine').notNull(),
});

export const topicRelations = relations(topic, ({ many }) => ({
  messages: many(message),
}));

export const message = pgTable('message', {
  id: serial('id').primaryKey(),
  topic: integer('topic').notNull(),
  source: text('source').notNull(),
  text: text('text').notNull(),
  time: bigint('time', { mode: 'number' }).notNull(),
});

export const messageRelations = relations(message, ({ one }) => ({
  topic: one(topic),
}));
