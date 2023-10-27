import { EngineOption } from '../chat/options';

export interface Topic extends TopicOptions {
  user: number;
  id: number;
}

export interface TopicOptions {
  engine: string;
  title: string;
  options: EngineOption[];
}

export interface TopicStorage {
  list(userId: number): Promise<Topic[]>;
  get(id: number): Promise<Topic | undefined>;
  save(details: Partial<Topic>): Promise<number>;
  delete(id: number): Promise<void>;
}
