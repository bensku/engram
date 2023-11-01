import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { CompletionEnd, CompletionService } from '../completion';
import { Message } from '../message';

const CLIENT = new BedrockRuntimeClient();
const TEXT_DECODER = new TextDecoder();

export function bedrockCompletions(
  model: string,
  modelStyle: 'claude' | 'cohere' | 'ai21',
): CompletionService {
  return async function* (context, options) {
    let bodyText: string;
    if (modelStyle == 'claude') {
      const body: ClaudeBody = {
        prompt: claudePrompt(context),
        temperature: options.temperature,
        max_tokens_to_sample: options.maxTokens,
        stop_sequences: ['\n\nHuman:'],
      };
      bodyText = JSON.stringify(body);
    } else if (modelStyle == 'cohere') {
      const body: CommandBody = {
        prompt: simplePrompt(context),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
        stop_sequences: ['\nUser:'],
      };
      bodyText = JSON.stringify(body);
    } else {
      throw new Error();
    }
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: model,
      body: bodyText,
      contentType: 'application/json',
    });
    const result = await CLIENT.send(command);
    if (result.body == undefined) {
      throw new Error('missing body'); // ???
    }
    for await (const entry of result.body) {
      if (entry.chunk) {
        if (modelStyle == 'claude') {
          const part = JSON.parse(
            TEXT_DECODER.decode(entry.chunk.bytes),
          ) as ClaudeCompletionPart;
          yield part.completion;
        } else if (modelStyle == 'cohere') {
          const part = JSON.parse(
            TEXT_DECODER.decode(entry.chunk.bytes),
          ) as CommandCompletionPart;
          if (part.text) {
            yield part.text;
          }
        }
      } // TODO: else handle errors
    }
    yield CompletionEnd;
  };
}

function claudePrompt(context: Message[]): string {
  // Merge system prompt and first user prompt, since Claude may disregard the real system prompt
  return (
    `\n\nHuman: ${context[0].text} ${context[1].text}` +
    context
      .slice(2)
      .map(
        (msg) =>
          `${msg.type == 'bot' ? '\n\nAssistant:' : '\n\nHuman:'}${msg.text}`,
      )
      .join() +
    '\n\nAssistant:'
  );
}

interface ClaudeBody {
  prompt: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens_to_sample?: number;
  stop_sequences?: string[];
}

interface ClaudeCompletionPart {
  completion: string;
  stop_reason?: string;
  stop?: string;
}

function simplePrompt(context: Message[]): string {
  return (
    `${context[0].text}\n` +
    context
      .slice(1)
      .map(
        (msg) => `${msg.type == 'bot' ? '\nAssistant:' : '\nUser:'}${msg.text}`,
      )
      .join() +
    '\nAssistant:'
  );
}

interface CommandBody {
  prompt: string;
  temperature?: number;
  p?: number;
  k?: number;
  max_tokens?: number;
  stop_sequences?: string[];
  return_likelihoods?: 'GENERATION' | 'ALL' | 'NONE';
  stream?: boolean;
  num_generations?: number;
}

interface CommandCompletionPart {
  is_finished: boolean;
  text?: string;
  finish_reason?: string;
}
