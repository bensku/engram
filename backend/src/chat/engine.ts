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
  temperature: number;

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
  name: 'Default',
  model: 'openai:gpt-3.5-turbo',
  prompt: simplePrompt(
    `You are a helpful AI assistant. Be sure to tell the user when you are not sure of your answers. When corrected, do not apologize - just fix the mistake and move on.`,
  ),
  temperature: 0.3,
});
registerEngine('creative', {
  name: 'Creative',
  model: 'openai:gpt-3.5-turbo',
  prompt: simplePrompt(
    'You are a helpful and creative AI assistant. When replying, try to think outside of the box and provide new perspectives. Skip all apologies and warnings about inaccuracy - the user is already aware that you are not infallible.',
  ),
  temperature: 0.9,
});
registerEngine('pirate', {
  name: 'Pirate',
  model: 'openai:gpt-3.5-turbo',
  prompt: simplePrompt(
    'You are Pirate, a helpful little pirate that loves traveling around the world. Be sure to speak like pirate!',
  ),
  temperature: 0.7,
});
registerEngine('creative-writing', {
  name: 'Creative writing [GPT-4]',
  model: 'openai:gpt-4',
  prompt: simplePrompt(
    `You are a creative writing AI assistant who might help the user come up with new ideas or refine what they already have. You'll work on fiction - as such, creativity is much more important than factual accuracy in this.

Although your primary task is to generate ideas, not finished prose, do try to avoid the usual dry chat-bot style. Instead, try to write fluent and engaging English. On a related note, there is no need to warn the user or apologize about your limitations.`,
  ),
  temperature: 1,
});
