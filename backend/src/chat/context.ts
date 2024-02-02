import { metadataForModel, tokenCounterForModel } from '../service/completion';
import { DbMessageStorage } from '../service/impl/postgres';
import { Message, MessageStorage } from '../service/message';
import { TokenCounterService } from '../service/tokenization';
import { MAX_REPLY_TOKENS } from './engine';
import { MAX_TOKENS, MODEL, PROMPT, SPEECH_MODE } from './options';
import { GenerateContext } from './pipeline';
import { promptMessages } from './prompt';

const storage: MessageStorage = new DbMessageStorage();

export async function fullContext(topicId: number): Promise<Message[]> {
  return (await storage.get(topicId)) ?? [];
}

export async function topicContext(ctx: GenerateContext): Promise<Message[]> {
  let context = (await storage.get(ctx.topic.id)) ?? [];
  context = [...promptMessages(PROMPT.getOrThrow(ctx), ctx), ...context];

  // Context length is smallest of: what model can do and what limit has been set for engine
  const model = MODEL.getOrThrow(ctx);
  const maxLen = Math.min(
    metadataForModel(model).maxTokens - MAX_REPLY_TOKENS,
    MAX_TOKENS.get(ctx) ?? Number.MAX_SAFE_INTEGER,
  );
  context = truncateContext(tokenCounterForModel(model), context, maxLen);

  if (SPEECH_MODE.get(ctx)) {
    context[0] = {
      ...context[0],
      text: `${
        context[0].text ?? ''
      }\n\nYou are in a voice call with the user. Most of the time, your lines should be a sentence or two, unless the user requests reasoning or long-form outputs. Don't include links in your lines, as they cannot be read out loud.`,
    };
  }

  return context;
}

function truncateContext(
  tokenizer: TokenCounterService,
  context: Message[],
  targetLen: number,
): Message[] {
  const lengths = context.map(tokenizer);
  const total = lengths.reduce((partial, x) => partial + x, 0);
  if (total <= targetLen) {
    return context; // No need to truncate anything
  }

  // Truncate by dropping oldest non-system messages
  // There are better techniques, but with 32k context this matters a bit less than before
  let overLimit = total - targetLen;
  const newCtx: Message[] = [];
  const removeCalls = new Set<string>();
  for (let i = 0; i < context.length; i++) {
    const msg = context[i];
    if (msg.type == 'system') {
      newCtx.push(msg);
      continue; // Never remove system prompt!
    }
    if (overLimit > 0 || (msg.type == 'tool' && removeCalls.has(msg.callId))) {
      // Remove message if we're still over limit OR it is a dangling tool calls (OpenAI disallows those)
      // (remove = don't add to new context; otherwise we couldn't refer to lengths by i anymore)
      overLimit -= lengths[i];

      // If we removed tool calls, make sure the tool responses are gone too
      if (msg.type == 'bot' && msg.toolCalls) {
        for (const call of msg.toolCalls) {
          removeCalls.add(call.id);
        }
      }
    } else {
      newCtx.push(msg);
    }
  }

  return newCtx;
}

export async function appendContext(
  topicId: number,
  message: Message,
): Promise<number> {
  return storage.append(topicId, message);
}

export function updateMessage(id: number, content: string): Promise<void> {
  return storage.update(id, content);
}

export function deleteMessage(id: number): Promise<void> {
  return storage.delete(id);
}
