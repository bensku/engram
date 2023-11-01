import { ReadableStream } from 'stream/web';
import { readLines } from '@bensku/engram-shared/src/sse';
import { components, paths } from '../../../generated/openai';
import { CompletionEnd, CompletionService } from '../completion';
import { Message } from '../message';

declare global {
  const fetch: typeof import('node-fetch').default;
}

const API_URL = 'https://api.openai.com/v1';

export function openAICompletions(
  apiKey: string,
  type: 'text' | 'chat',
  model: string,
): CompletionService {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (type == 'text') {
    throw new Error('unimplemented');
    // return async function* () {};
  } else {
    return async function* (context, options) {
      const body: paths['/chat/completions']['post']['requestBody']['content']['application/json'] =
        {
          stream: true,
          model,
          messages: context.map(chatGptMessage),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        };
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      });
      const reader = (
        response.body as unknown as ReadableStream<Uint8Array>
      ).getReader();
      // TODO error handling
      for await (const line of readLines(reader)) {
        if (line.trim() == 'data: [DONE]') {
          yield CompletionEnd;
        } else if (line.startsWith('data: ')) {
          const part = JSON.parse(
            line.substring('data: '.length),
          ) as ChatCompletionPart;
          const text = part.choices[0].delta.content;
          if (text) {
            yield text;
          }
        } // else: ignore
      }
    };
  }
}

function chatGptMessage(
  message: Message,
): components['schemas']['ChatCompletionRequestMessage'] {
  return {
    content: message.text,
    role: message.type == 'bot' ? 'assistant' : 'user',
    // TODO does this actually do anything? no docs anywhere
    // name: 'user' in message ? message.user : 'assistant',
  };
}

interface ChatCompletionPart {
  choices: {
    delta: { content?: string };
    index: number;
    finish_reason: string | null;
  }[];
}
