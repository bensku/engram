import { db } from '../../db/core';
import { message, topic } from '../../db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { Message, MessageStorage } from '../message';
import { Topic, TopicStorage } from '../topic';
import { ToolCall } from 'backend/src/tool/call';

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
          options: details.options,
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
            options: details.options ?? {},
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
      if (msg.type == 'bot') {
        return {
          type: 'bot',
          id: msg.id,
          time: msg.time,
          text: msg.text ?? undefined,
          agent: msg.source ?? 'unknown',
          toolCalls: msg.toolData as ToolCall[],
        };
      } else if (msg.type == 'tool') {
        return {
          type: 'tool',
          id: msg.id,
          time: msg.time,
          text: msg.text as string,
          tool: msg.source ?? 'unknown',
          callId: msg.toolData as string,
        };
      } else if (msg.type == 'user') {
        return {
          type: 'user',
          id: msg.id,
          time: msg.time,
          text: msg.text as string,
        };
      } else {
        throw new Error(`unknown message type in database: ${msg.type}`);
      }
    });
  }
  async append(topicId: number, msg: Message): Promise<number> {
    let source = null;
    if (msg.type == 'bot') {
      source = msg.agent;
    } else if (msg.type == 'tool') {
      source = msg.tool;
    }
    let toolData = null;
    if (msg.type == 'bot') {
      toolData = msg.toolCalls;
    } else if (msg.type == 'tool') {
      toolData = msg.callId;
    }
    const result = await db
      .insert(message)
      .values({
        type: msg.type,
        topic: topicId,
        time: msg.time,
        text: msg.text,
        source,
        toolData,
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
