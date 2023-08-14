import { ModelOptions } from '../service/completion';
import { Message } from '../service/message';
import { simplePrompt } from './prompt';

export interface EngineMetadata {
  /**
   * Internal id of the engine. Changing this may break old topics!
   */
  id: string;

  /**
   * User-visible name of the engine. This can be changed safely.
   */
  name: string;
}

export interface EngineConfig {
  /**
   * AI model to use.
   */
  model: string;

  /**
   * Prompt for the main model.
   */
  prompt: Message[];

  /**
   * Randomness and "creativity" of the generation.
   */
  temperature?: number;

  /**
   * Penalty for tokens that have RECENTLY appeared in text.
   */
  frequencyPenalty?: number;

  /**
   * Penalty for repeating tokens that have previously appeared in text.
   */
  presencePenalty?: number;
}

export type ChatEngine = EngineMetadata & EngineConfig;

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

export function toModelOptions(engine: ChatEngine): ModelOptions {
  return {
    temperature: engine.temperature,
  };
}

function registerEngine(id: string, details: Omit<ChatEngine, 'id'>) {
  const engine = { id, ...details };
  ENGINES.set(id, engine);
  ENGINE_LIST.push(engine);
}

registerEngine('default', {
  name: 'Default (GPT-3.5)',
  model: 'openai:gpt-3.5-turbo',
  prompt: simplePrompt('You are a helpful AI assistant.'),
});
registerEngine('pirate', {
  name: 'Pirate',
  model: 'openai:gpt-3.5-turbo',
  prompt: simplePrompt(
    'You are Pirate, a helpful little pirate that loves traveling around the world. Be sure to speak like pirate!',
  ),
});
registerEngine('hallucination', {
  name: 'Hallucination',
  model: 'openai:gpt-3.5-turbo',
  prompt: simplePrompt('You are an AI that writes funny nonsense.'),
  temperature: 1.4,
});
