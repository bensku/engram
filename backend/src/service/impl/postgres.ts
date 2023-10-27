import { db } from '../../db/core';
import { message, topic } from '../../db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { Message, MessageStorage } from '../message';
import { Topic, TopicStorage } from '../topic';

export class DbTopicStorage implements TopicStorage {
  async list(userId: number): Promise<Topic[]> {
    return await db.query.topic.findMany({
      where: eq(topic.user, userId),
      orderBy: desc(topic.id),
    });
  }
  get(id: number): Promise<Topic | undefined> {
    return db.query.topic.findFirst({
      where: eq(topic.id, id),
    });
  }
  async save(details: Partial<Topic>): Promise<number> {
    if (details.id !== undefined) {
      await db
        .update(topic)
        .set({
          title: details.title,
          engine: details.engine,
        })
        .where(eq(topic.id, details.id));
      return details.id;
    } else {
      if (details.user === undefined) {
        throw new Error();
      }
      return (
        await db
          .insert(topic)
          .values({
            title: details.title ?? '',
            user: details.user,
            engine: details.engine ?? 'default',
            options: details.options ?? [],
          })
          .returning({ id: topic.id })
      )[0].id;
    }
  }
  async delete(id: number): Promise<void> {
    await db.delete(topic).where(eq(topic.id, id));
  }
}

export class DbMessageStorage implements MessageStorage {
  async get(topicId: number): Promise<Message[] | null> {
    const messages = await db.query.message.findMany({
      where: eq(message.topic, topicId),
      orderBy: asc(message.id),
    });
    return messages.map((msg) => {
      if (msg.source == 'user') {
        return {
          type: 'user',
          id: msg.id,
          text: msg.text,
          time: msg.time,
        };
      } else {
        return {
          type: 'bot',
          id: msg.id,
          text: msg.text,
          time: msg.time,
          agent: msg.source,
        };
      }
    });
  }
  async append(topicId: number, msg: Message): Promise<number> {
    const result = await db
      .insert(message)
      .values({
        topic: topicId,
        source: msg.type == 'bot' ? msg.agent : 'user',
        text: msg.text,
        time: msg.time,
      })
      .returning({ id: message.id });
    return result[0].id;
  }
  async update(messageId: number, content: string): Promise<void> {
    await db.update(message).set({
      id: messageId,
      text: content,
    });
  }
  async delete(messageId: number): Promise<void> {
    await db.delete(message).where(eq(message.id, messageId));
  }
}
