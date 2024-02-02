import { registerEngine } from '../engine';
import {
  MODEL,
  OptionType,
  PROMPT,
  SelectOption,
  TEMPERATURE,
} from '../options';
import { replacePlaceholderWithOption } from '../prompt';
import { newAnalyzer } from '../analyzer';
import { JSONSchemaType } from 'ajv';

const LANGUAGE = new OptionType<SelectOption>(
  'select',
  'code.language',
  'Programming language',
);

const engine = registerEngine(
  'coding',
  'Coding',
  MODEL.create({
    defaultValue: 'openai:gpt-4',
    choices: [
      { value: 'openai:gpt-4', title: 'GPT-4 (default)' },
      { value: 'mistral:medium', title: 'mistral-medium' },
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5' },
      // TODO add other models
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
        'You are an professional software development assistant. When you write code, use {LANG} unless another language is requested.',
      ],
    },
  }),
  LANGUAGE.create({
    defaultValue: 'auto',
    choices: [
      { value: 'auto', title: 'Auto-pick (default)' },
      { value: 'typescript', title: 'Typescript' },
      { value: 'python', title: 'Python' },
      { value: 'java', title: 'Java' },
      { value: 'shell', title: 'Unix shell' },
      { value: 'javascript', title: 'Javascript' },
    ],
    userEditable: true,
  }),
);

engine.preHandlers = [
  async (ctx) => {
    const msg = ctx.context[ctx.context.length - 1].text;
    if (LANGUAGE.getOrThrow(ctx) == 'auto' && msg) {
      // Use another LLM to pick the language
      let language = (await LANGUAGE_CHOOSER(msg)).language;
      if (language == 'none') {
        language = 'typescript'; // Default to TypeScript
      }
      console.log(language);
      // Set it in topic; this won't be saved anywhere
      ctx.topic.options[LANGUAGE.id] = language;
    }
  },
  replacePlaceholderWithOption('{LANG}', LANGUAGE),
];

const LANGUAGE_SCHEMA: JSONSchemaType<{ language: string }> = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      description:
        'Programming language name (typescript, python, java, shell or unknown)',
      enum: ['typescript', 'python', 'java', 'shell', 'unknown'],
    },
  },
  required: ['language'],
};
const LANGUAGE_CHOOSER = newAnalyzer(
  'together:mistral-7b-v1',
  `What programming language would be most relevant for above message?
Available options: typescript, python, java, shell, unknown`,
  LANGUAGE_SCHEMA,
);
