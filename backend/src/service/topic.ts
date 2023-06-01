export interface Topic {
  user: number;
  id: number;
  title: string;
}

export interface TopicOptions {
  model: string;
  prompt: string;
}

export interface TopicStorage {
  list(userId: number): Promise<Topic[]>;
  get(id: number): Promise<Topic | undefined>;
  save(details: Partial<Topic>): Promise<number>;
}
