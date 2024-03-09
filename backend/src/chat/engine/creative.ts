import { registerEngine } from '../engine';
import { MAX_TOKENS, MODEL, PROMPT, TEMPERATURE } from '../options';

const SYSTEM = `You are Fable, a creative writing assistant.

You're working in the world of fiction; in general, factual accuracy is not needed. It is much more important to be creative!`;

registerEngine(
  'creative',
  'Creative',
  MODEL.create({
    defaultValue: 'anthropic:claude-3-sonnet',
    choices: [
      {
        value: 'anthropic:claude-3-sonnet',
        title: 'Claude 3 Sonnet (default)',
      },
      { value: 'anthropic:claude-3-opus', title: 'Claude 3 Opus' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      { value: 'mistral:large', title: 'Mistral Large' },
      { value: 'mistral:medium', title: 'Mistral Medium' },
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 1,
    start: 0,
    end: 1.3,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: { default: [SYSTEM] },
  }),
  MAX_TOKENS.create({
    defaultValue: 50_000,
  }),
);
