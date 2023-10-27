import { ModelOptions } from '../service/completion';
import { TopicOptions } from '../service/topic';
import { EngineOption, MODEL, TEMPERATURE } from './options';
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
    temperature: TEMPERATURE.get(engine, options.options),
  };
}

function registerEngine(id: string, name: string, ...options: EngineOption[]) {
  const engine = { id, name, options };
  ENGINES.set(id, engine);
  ENGINE_LIST.push(engine);
}

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
);

registerEngine(
  'pirate',
  'Pirate',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [{ value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' }],
    userEditable: true,
  }),
);
