import { openAICompletions } from './impl/openai';
import { Message } from './message';

export const CompletionEnd = Symbol();
export type CompletionPart = typeof CompletionEnd | string;

export type CompletionService = (
  context: Message[],
) => AsyncGenerator<CompletionPart, void, void>;

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

export function completionsForModel(model: string): CompletionService {
  const service = services[model];
  if (!service) {
    throw new Error(`model ${model} not found`);
  }
  return service;
}
