export interface Topic {
  user: number;
  id: number;
  title: string;
  engine: string;
}

export interface TopicOptions {
  engine: string;
  title: string;
}

export interface TopicStorage {
  list(userId: number): Promise<Topic[]>;
  get(id: number): Promise<Topic | undefined>;
  save(details: Partial<Topic>): Promise<number>;
  delete(id: number): Promise<void>;
}
