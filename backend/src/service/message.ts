interface BaseMessage {
  type: 'user' | 'bot' | 'system';

  /**
   * Unique id of the message.
   */
  id: string;

  /**
   * Main text content of the message. This is not necessarily sent as-is to
   * either the user or the LLM.
   */
  text: string;

  /**
   * Search query derived from this message and its context.
   */
  searchQuery?: string;
}

interface UserMessage extends BaseMessage {
  type: 'user';
}

interface BotMessage extends BaseMessage {
  type: 'bot';

  /**
   * Widgets. TODO
   */
  widgets: Widget[];
}

interface SystemMessage extends BaseMessage {
  type: 'system';
}

export type Message = UserMessage | BotMessage | SystemMessage;

export interface Widget {}

export interface MessageStorage {
  get(topic: string): Promise<Message[] | null>;
  append(topic: string, msg: Message): Promise<void>;
}
