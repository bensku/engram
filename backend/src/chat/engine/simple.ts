import { registerEngine } from '../engine';
import { MAX_TOKENS, MODEL, PROMPT, TEMPERATURE } from '../options';

registerEngine(
  'simple',
  'Simple',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      { value: 'bedrock:claude-instant-v1', title: 'Claude Instant' },
      { value: 'bedrock:claude-v2', title: 'Claude 2' },
      { value: 'bedrock:cohere-command', title: 'Cohere Command' },
      { value: 'mistral:medium', title: 'mistral-medium' },
      { value: 'together:mixtral-8x7', title: 'Mixtral 8x7B' },
      { value: 'perplexity:pplx-7b', title: 'Perplexity 7B' },
      { value: 'perplexity:pplx-7b-online', title: 'Perplexity 7B (online)' },
      { value: 'perplexity:pplx-70b', title: 'Perplexity 70B' },
      { value: 'perplexity:pplx-70b-online', title: 'Perplexity 70B (online)' },
    ],
    userEditable: true,
  }),
  MAX_TOKENS.create({
    defaultValue: 4000,
    start: 50,
    end: 100000,
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 0.3,
    start: 0,
    end: 1,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: { default: ['You are a helpful AI assistant.'] },
  }),
);
