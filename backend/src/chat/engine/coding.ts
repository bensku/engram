import { registerEngine } from '../engine';
import { MODEL, PROMPT, TEMPERATURE } from '../options';
import { simplePrompt } from '../prompt';

registerEngine(
  'coding',
  'Coding',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      // TODO add other models
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 0.3,
    start: 0,
    end: 1,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: simplePrompt(
      'You are Rune, an assistant to a professional software developer.',
    ), // TODO
  }),
);
