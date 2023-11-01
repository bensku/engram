import { bedrockCompletions } from './impl/bedrock';
import { openAICompletions } from './impl/openai';
import { Message } from './message';

export const CompletionEnd = Symbol();
export type CompletionPart = typeof CompletionEnd | string;

export type CompletionService = (
  context: Message[],
  options: ModelOptions,
) => AsyncGenerator<CompletionPart, void, void>;

export type BatchCompletionService = (
  context: Message[],
  options: ModelOptions,
) => Promise<string>;

const services: Record<string, CompletionService> = {};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY) {
  services['openai:gpt-3.5-turbo'] = openAICompletions(
    OPENAI_API_KEY,
    'chat',
    'gpt-3.5-turbo',
  );
  services['openai:gpt-4'] = openAICompletions(OPENAI_API_KEY, 'chat', 'gpt-4');
}

if (process.env.AWS_ACCESS_KEY_ID) {
  services['bedrock:claude-instant-v1'] = bedrockCompletions(
    'anthropic.claude-instant-v1',
    'claude',
  );
  services['bedrock:claude-v2'] = bedrockCompletions(
    'anthropic.claude-v2',
    'claude',
  );
  services['bedrock:cohere-command'] = bedrockCompletions(
    'cohere.command-text-v14',
    'cohere',
  );
}

export function completionsForModel(model: string): CompletionService {
  const service = services[model];
  if (!service) {
    throw new Error(`model ${model} not found`);
  }
  return service;
}

export function batchCompletionsForModel(
  model: string,
): BatchCompletionService {
  const completions = completionsForModel(model);
  return async (context, options) => {
    let text = '';
    for await (const part of completions(context, options)) {
      if (part == CompletionEnd) {
        break;
      } else {
        text += part;
      }
    }
    return text;
  };
}

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
}
