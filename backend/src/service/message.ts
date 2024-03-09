import { ToolCall } from '../tool/call';

interface BasePart {
  type: 'text' | 'image';
}

interface TextPart extends BasePart {
  type: 'text';

  /**
   * The text content.
   */
  text: string;
}

interface ImagePart extends BasePart {
  type: 'image';

  /**
   * Reference to the image in engram's storage backend.
   */
  objectId: string;
}

export type MessagePart = TextPart | ImagePart;

interface BaseMessage {
  type: 'user' | 'bot' | 'system' | 'tool';

  /**
   * Id of topic that this message belongs to.
   * Unset for messages that were not loaded from topic storage.
   */
  topicId?: number;

  /**
   * Unique id of the message.
   */
  id: number;

  /**
   * Message parts.
   */
  parts: MessagePart[];

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

  /**
   * Tool calls included in this message.
   */
  toolCalls?: ToolCall[];
}

interface SystemMessage extends BaseMessage {
  type: 'system';
}

interface ToolMessage extends BaseMessage {
  type: 'tool';

  tool: string;

  /**
   * Id of the tool call that resulted in this message.
   */
  callId: string;
}

export type Message = UserMessage | BotMessage | SystemMessage | ToolMessage;

export function message(type: 'user', content: string): UserMessage;
export function message(type: 'bot', content: string): BotMessage;
export function message(type: 'system', content: string): SystemMessage;
/**
 * Creates a simple message with only text content.
 * @param type Message type. This helper doesn't support tool calls.
 * @param content Message text content.
 */
export function message(
  type: 'user' | 'bot' | 'system',
  content: string,
): Message {
  const parts: MessagePart[] = [{ type: 'text', text: content }];
  if (type == 'bot') {
    return {
      type,
      id: -1,
      agent: 'engram',
      time: Date.now(),
      parts,
    };
  } else {
    return {
      type,
      id: -1,
      time: Date.now(),
      parts,
    };
  }
}

export function appendText(msg: Message, text: string): void {
  msg.parts.push({ type: 'text', text });
}

export function extractText(msg: Message): string {
  return msg.parts
    .map((part) => (part.type == 'text' ? part.text : ''))
    .join('');
}

export interface FileUpload {
  /**
   * File name of client.
   */
  name: string;

  /**
   * Mime type of the file.
   */
  type: string;

  /**
   * BASE64-encoded file data.
   */
  data: string;
}

export interface PostMessageRequest {
  format: string;
  message: string;
  attachments: FileUpload[];
}

export interface MessageStorage {
  get(topicId: number): Promise<Message[] | null>;
  getOne(messageId: number): Promise<Message | null>;
  append(topicId: number, msg: Message): Promise<number>;
  update(messageId: number, content: MessagePart[]): Promise<void>;
  delete(messageId: number): Promise<void>;
}
