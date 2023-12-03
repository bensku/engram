import { ToolCall } from '../tool/call';
import { Tool } from '../tool/core';
import { bedrockCompletions } from './impl/bedrock';
import { openAICompletions } from './impl/openai';
import { Message } from './message';

export type CompletionPart =
  | { type: 'text'; text: string }
  | { type: 'tool'; calls: ToolCall[] }
  | { type: 'end' };

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
  const apiUrl = 'https://api.openai.com/v1';
  services['openai:gpt-3.5-turbo'] = openAICompletions(
    apiUrl,
    OPENAI_API_KEY,
    'chat',
    'gpt-3.5-turbo-1106',
  );
  services['openai:gpt-4'] = openAICompletions(
    apiUrl,
    OPENAI_API_KEY,
    'chat',
    'gpt-4-1106-preview',
  );
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

// Anyscale Endpoints hosts common "open source" LLMs (cheaper than renting own GPUs)
const ANYSCALE_API_KEY = process.env.ANYSCALE_API_KEY;
if (ANYSCALE_API_KEY) {
  const apiUrl = 'https://api.endpoints.anyscale.com/v1';
  services['anyscale:llama-2-7b'] = openAICompletions(
    apiUrl,
    ANYSCALE_API_KEY,
    'chat',
    'meta-llama/Llama-2-7b-chat-hf',
  );
  services['anyscale:llama-2-13b'] = openAICompletions(
    apiUrl,
    ANYSCALE_API_KEY,
    'chat',
    'meta-llama/Llama-2-13b-chat-hf',
  );
  services['anyscale:llama-2-70b'] = openAICompletions(
    apiUrl,
    ANYSCALE_API_KEY,
    'chat',
    'meta-llama/Llama-2-70b-chat-hf',
  );
  services['anyscale:codellama-34b'] = openAICompletions(
    apiUrl,
    ANYSCALE_API_KEY,
    'chat',
    'codellama/CodeLlama-34b-Instruct-hf',
  );
  services['anyscale:mistral-7b-v0.1'] = openAICompletions(
    apiUrl,
    ANYSCALE_API_KEY,
    'chat',
    'mistralai/Mistral-7B-Instruct-v0.1',
  );
}

// Deepinfra hosts several interesting "open source" LLMs (albeit with somewhat questionable privacy guarantees)
const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
if (DEEPINFRA_API_KEY) {
  const apiUrl = 'https://api.deepinfra.com/v1/openai';
  services['deepinfra:mistrallite'] = openAICompletions(
    apiUrl,
    DEEPINFRA_API_KEY,
    'chat',
    'amazon/MistralLite',
  );
  services['deepinfra:openchat-3.5'] = openAICompletions(
    apiUrl,
    DEEPINFRA_API_KEY,
    'chat',
    'openchat/openchat_3.5',
  );
  services['deepinfra:mythomax-l2-13b'] = openAICompletions(
    apiUrl,
    DEEPINFRA_API_KEY,
    'chat',
    'Gryphe/MythoMax-L2-13b',
  );
  services['deepinfra:airoboros-70b'] = openAICompletions(
    apiUrl,
    DEEPINFRA_API_KEY,
    'chat',
    'deepinfra/airoboros-70b',
  );
  services['deepinfra:airoboros-l2-70b'] = openAICompletions(
    apiUrl,
    DEEPINFRA_API_KEY,
    'chat',
    'jondurbin/airoboros-l2-70b-gpt4-1.4.1',
  );
  services['deepinfra:lzlv-70b'] = openAICompletions(
    apiUrl,
    DEEPINFRA_API_KEY,
    'chat',
    'lizpreciatior/lzlv_70b_fp16_hf',
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
      if (part.type == 'end') {
        break;
      } else if (part.type == 'text') {
        text += part.text;
      } else {
        throw new Error('batch completions do not yet support tools');
      }
    }
    return text;
  };
}

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  enabledTools?: Tool<object>[];
}
