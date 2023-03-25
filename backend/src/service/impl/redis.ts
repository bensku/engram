import { Message, MessageStorage } from '../message';

export class RedisMessageStorage implements MessageStorage {
  async get(topic: string): Promise<Message[] | null> {
    return null;
  }
  async append(topic: string, msg: Message): Promise<void> {}
}
