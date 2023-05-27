import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const topic = pgTable('topic', {
  id: serial('id').primaryKey(),
});

export const topicRelations = relations(topic, ({ many }) => ({
  messages: many(message),
}));

export const message = pgTable('message', {
  id: serial('id').primaryKey(),
  topic: integer('topic'),
  source: text('source'),
  text: text('text'),
});

export const messageRelations = relations(message, ({ one }) => ({
  topic: one(topic),
}));
