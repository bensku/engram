import { registerEngine } from '../engine';
import {
  MODEL,
  OptionType,
  PROMPT,
  SelectOption,
  TEMPERATURE,
} from '../options';
import { replacePlaceholderWithOption } from '../prompt';

const LANGUAGE = new OptionType<SelectOption>(
  'select',
  'code.language',
  'Programming language',
);

const engine = registerEngine(
  'coding',
  'Coding',
  MODEL.create({
    defaultValue: 'anthropic:claude-3-opus',
    choices: [
      { value: 'anthropic:claude-3-opus', title: 'Claude 3 Opus (default)' },
      { value: 'mistral:large', title: 'Mistral Large' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      {
        value: 'anthropic:claude-3-sonnet',
        title: 'Claude 3 Sonnet',
      },
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 0.1,
    start: 0,
    end: 1,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: {
      default: [
        'You are an professional software development assistant. When writing code, use {LANG} unless another language was specified.',
      ],
    },
  }),
  LANGUAGE.create({
    defaultValue: 'typescript',
    choices: [
      { value: 'typescript', title: 'Typescript' },
      { value: 'python', title: 'Python' },
      { value: 'java', title: 'Java' },
      { value: 'shell', title: 'Unix shell' },
      { value: 'javascript', title: 'Javascript' },
    ],
    userEditable: true,
  }),
);

engine.preHandlers = [replacePlaceholderWithOption('{LANG}', LANGUAGE)];
