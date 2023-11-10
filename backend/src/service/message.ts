import { ToolCall } from '../tool/call';

interface BaseMessage {
  type: 'user' | 'bot' | 'system' | 'tool';

  /**
   * Unique id of the message.
   */
  id: number;

  /**
   * Main text content of the message. This is not necessarily sent as-is to
   * either the user or the LLM.
   */
  text?: string;

  /**
   * Time as milliseconds since UNIX epoch. Frontend should use local time zone to display this.
   */
  time: number;
}

interface UserMessage extends BaseMessage {
  type: 'user';
  text: string;
}

interface BotMessage extends BaseMessage {
  type: 'bot';

  agent: string;

  /**
   * Tool calls included in this message.
   */
  toolCalls?: ToolCall[];
}

interface SystemMessage extends BaseMessage {
  type: 'system';
  text: string;
}

interface ToolMessage extends BaseMessage {
  type: 'tool';
  text: string;

  tool: string;

  /**
   * Id of the tool call that resulted in this message.
   */
  callId: string;
}

export type Message = UserMessage | BotMessage | SystemMessage | ToolMessage;

export interface PostMessageRequest {
  message: string;
}

export interface MessageStorage {
  get(topicId: number): Promise<Message[] | null>;
  append(topicId: number, msg: Message): Promise<number>;
  update(messageId: number, content: string): Promise<void>;
  delete(messageId: number): Promise<void>;
}
