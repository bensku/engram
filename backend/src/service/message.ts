interface BaseMessage {
  type: 'user' | 'bot' | 'system';

  /**
   * Unique id of the message.
   */
  id: number;

  /**
   * Main text content of the message. This is not necessarily sent as-is to
   * either the user or the LLM.
   */
  text: string;

  /**
   * Time as milliseconds since UNIX epoch. Frontend should use local time zone to display this.
   */
  time: number;
}

interface UserMessage extends BaseMessage {
  type: 'user';
}

interface BotMessage extends BaseMessage {
  type: 'bot';

  agent: string;
}

interface SystemMessage extends BaseMessage {
  type: 'system';
}

export interface PostMessageRequest {
  message: string;
}

export type Message = UserMessage | BotMessage | SystemMessage;

export interface MessageStorage {
  get(topic: number): Promise<Message[] | null>;
  append(topic: number, msg: Message): Promise<number>;
}
