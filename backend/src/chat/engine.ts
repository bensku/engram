import { ModelOptions } from '../service/completion';
import { Tool, getTools } from '../tool/core';
import { EngineOption, TEMPERATURE } from './options';
import { GenerateCallback, GenerateContext } from './pipeline';

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

  /**
   * Callbacks that are executed before generating reply.
   */
  preHandlers: GenerateCallback[];
}

export const MAX_REPLY_TOKENS = 2000;

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

export function toModelOptions(ctx: GenerateContext): ModelOptions {
  // Figure out which tools are enabled for the topic
  const enabledTools: Tool<object>[] = [];
  for (const [, tool] of getTools().entries()) {
    if (tool.enableOption.get(ctx)) {
      enabledTools.push(tool);
    }
  }

  return {
    temperature: TEMPERATURE.getOrThrow(ctx),
    maxTokens: MAX_REPLY_TOKENS,
    enabledTools,
  };
}

export function registerEngine(
  id: string,
  name: string,
  ...options: EngineOption[]
): ChatEngine {
  const engine = { id, name, options, preHandlers: [] };
  ENGINES.set(id, engine);
  ENGINE_LIST.push(engine);
  return engine;
}

// Import engines in order they should be shown in UI
import './engine/default';
import './engine/coding';
import './engine/creative';
import './engine/simple';
// TODO add drop-down menu for other/toy/experimental engines
