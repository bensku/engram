import { ModelOptions } from '../service/completion';
import { TopicOptions } from '../service/topic';
import { Tool, getTools } from '../tool/core';
import { EngineOption, TEMPERATURE } from './options';

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
  // Figure out which tools are enabled for the topic
  const enabledTools: Tool<object>[] = [];
  for (const [, tool] of getTools().entries()) {
    if (tool.enableOption.get(engine, options.options)) {
      enabledTools.push(tool);
    }
  }

  return {
    temperature: TEMPERATURE.getOrThrow(engine, options.options),
    maxTokens: 2000,
    enabledTools,
  };
}

export function registerEngine(
  id: string,
  name: string,
  ...options: EngineOption[]
) {
  const engine = { id, name, options };
  ENGINES.set(id, engine);
  ENGINE_LIST.push(engine);
}

// Import engines in order they should be shown in UI
import './engine/default';
import './engine/coding';
import './engine/creative';
import './engine/simple';
// TODO add drop-down menu for other/toy/experimental engines
