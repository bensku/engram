import { Message, MessageStorage } from '../message';

export class RedisMessageStorage implements MessageStorage {
  async get(topic: number): Promise<Message[] | null> {
    return [];
  }
  async append(topic: number, msg: Message): Promise<number> {
    return Promise.resolve(0);
  }
}
