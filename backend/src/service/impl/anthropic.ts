import Anthropic from '@anthropic-ai/sdk';
import { CompletionService } from '../completion';
import {
  ImageBlockParam,
  MessageParam,
  TextBlock,
} from '@anthropic-ai/sdk/resources';
import { Message, MessagePart, extractText } from '../message';
import { getAttachment } from '../../chat/attachment';
import sharp from 'sharp';

export function anthropicCompletions(
  apiKey: string,
  model: string,
): CompletionService {
  const client = new Anthropic({ apiKey });

  return async function* (context, options) {
    const stream = await client.messages.create({
      messages: await Promise.all(context.slice(1).map(convertMessage)),
      system: extractText(context[0]),
      model,
      max_tokens: options.maxTokens ?? 1000,
      temperature: options.temperature,
      stream: true,
    });
    for await (const event of stream) {
      // TODO other event types?
      if (event.type == 'content_block_delta') {
        yield { type: 'text', text: event.delta.text };
      }
    }
  };
}

async function convertMessage(msg: Message): Promise<MessageParam> {
  if (msg.type == 'system') {
    throw new Error('unexpected system message');
  } else if (msg.type == 'user') {
    return {
      role: 'user',
      content: await Promise.all(msg.parts.map(convertPart)),
    };
  } else if (msg.type == 'bot') {
    return {
      role: 'assistant',
      content: extractText(msg), // Bot messages can't (yet) have images
    };
  } else if (msg.type == 'tool') {
    throw new Error('claude currently only supports tools on Bedrock');
  } else {
    throw new Error();
  }
}

async function convertPart(
  part: MessagePart,
): Promise<TextBlock | ImageBlockParam> {
  if (part.type == 'text') {
    return { type: 'text', text: part.text };
  } else if (part.type == 'image') {
    // Convert image part to BASE64
    const obj = await getAttachment(part.objectId);
    // Resize the image if needed
    const data = await resizeIfNeeded(Buffer.from(obj.data));

    // We'll assume that Claude supports all image types that we support
    return {
      type: 'image',
      source: {
        media_type: obj.mimeType as ImageBlockParam.Source['media_type'],
        data: Buffer.from(data).toString('base64'),
        type: 'base64',
      },
    };
  } else {
    throw new Error('unexpected part.type');
  }
}

function resizeIfNeeded(data: Buffer): Promise<Buffer> {
  // See https://docs.anthropic.com/claude/docs/vision for recommended sizes
  return sharp(data)
    .resize({ width: 1000, withoutEnlargement: true })
    .toBuffer();
}
