import { ModelOptions } from '../service/completion';
import { TopicOptions } from '../service/topic';
import {
  EngineOption,
  MODEL,
  OptionType,
  PROMPT,
  TEMPERATURE,
} from './options';
import { simplePrompt } from './prompt';

export interface ChatEngine {
  /**
   * Internal id of the engine. Changing this may break old topics!
   */
  id: string;

  /**
   * User-visible name of the engine. This can be changed safely.
   */
  name: string;

  /**
   * All engine options.
   */
  options: EngineOption[];
}

const ENGINES: Map<string, ChatEngine> = new Map();
const ENGINE_LIST: ChatEngine[] = []; // To keep engines in insertion order

export function getEngine(id: string): ChatEngine {
  const engine = ENGINES.get(id);
  if (!engine) {
    throw new Error(`no engine found with ${id}`);
  }
  return engine;
}

export function listEngines(): ChatEngine[] {
  return ENGINE_LIST;
}

export function toModelOptions(
  engine: ChatEngine,
  options: TopicOptions,
): ModelOptions {
  return {
    temperature: TEMPERATURE.getOrThrow(engine, options.options),
  };
}

function registerEngine(id: string, name: string, ...options: EngineOption[]) {
  const engine = { id, name, options };
  ENGINES.set(id, engine);
  ENGINE_LIST.push(engine);
}

const WOLFRAM_ALPHA = new OptionType(
  'toggle',
  'wolfram-alpha',
  'Enable Wolfram Alpha',
);

registerEngine(
  'default',
  'Default',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 0.3,
    start: 0,
    end: 1.5,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: simplePrompt('You are a helpful AI assistant.'),
  }),
  WOLFRAM_ALPHA.create({
    defaultValue: false,
    userEditable: true,
  }),
);

registerEngine(
  'pirate',
  'Pirate',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
  }),
  TEMPERATURE.create({
    defaultValue: 0.8,
  }),
  PROMPT.create({
    defaultValue: simplePrompt(
      'You are Pirate, a helpful little pirate that loves traveling around the world. Be sure to speak like pirate!',
    ),
  }),
);

registerEngine(
  'simple',
  'Simple',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
  }),
  TEMPERATURE.create({
    defaultValue: 0.8,
  }),
  PROMPT.create({
    defaultValue: simplePrompt('You are a helpful AI assistant.'),
  }),
);
