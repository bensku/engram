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
      { value: 'openai:gpt-4-vision', title: 'GPT-4V' },
      {
        value: 'anthropic:claude-3-sonnet',
        title: 'Claude 3 Sonnet',
      },
      { value: 'anthropic:claude-3-opus', title: 'Claude 3 Opus' },
      { value: 'bedrock:claude-instant-v1', title: 'Claude Instant (Bedrock)' },
      { value: 'bedrock:claude-v2', title: 'Claude 2 (Bedrock)' },
      { value: 'bedrock:cohere-command', title: 'Cohere Command' },
      { value: 'mistral:small', title: 'Mistral Small' },
      { value: 'mistral:large', title: 'Mistral Large' },
      { value: 'mistral:medium', title: 'Mistral Medium' },
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
