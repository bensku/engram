import { ToolCall } from '../tool/call';
import { Tool } from '../tool/core';
import { Message } from './message';

export type CompletionPart =
  | { type: 'text'; text: string }
  | { type: 'tool'; calls: ToolCall[] }
  | { type: 'end' };

export type CompletionService = (
  context: Message[],
  options: ModelOptions,
) => AsyncGenerator<CompletionPart, void, void>;

export type BatchCompletionService = (
  context: Message[],
  options: ModelOptions,
) => Promise<string>;

export type ToolCompletionService = (
  context: Message[],
  options: ModelOptions,
) => Promise<ToolCall[]>;

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  enabledTools?: Tool<object>[];
  stopTokens?: string[];
  jsonMode?: boolean | JSONSchemaType<object>;
}

export interface ModelMetadata {
  /**
   * The maximum amount of tokens this model supports.
   * If this is less than engine's maximum allowed tokens, we'll use this.
   */
  maxTokens: number;

  /**
   * Input cost in dollars (or euros) per 1000 tokens.
   */
  inputCost: number;

  /**
   * Output cost per 1000 tokens.
   */
  outputCost: number;
}

const services: Record<string, CompletionService> = {};
const tokenCounters: Record<string, TokenCounterService> = {};
const metadatas: Record<string, ModelMetadata> = {};

export function completionsForModel(model: string): CompletionService {
  const service = services[model];
  if (!service) {
    throw new Error(`model ${model} not found`);
  }
  return service;
}

export function batchCompletionsForModel(
  model: string,
): BatchCompletionService {
  const completions = completionsForModel(model);
  return async (context, options) => {
    let text = '';
    for await (const part of completions(context, options)) {
      if (part.type == 'end') {
        break;
      } else if (part.type == 'text') {
        text += part.text;
      } else {
        throw new Error('batch completions do not yet support tools');
      }
    }
    return text;
  };
}

export function toolCompletionsForModel(model: string): ToolCompletionService {
  const completions = completionsForModel(model);
  return async (context, options) => {
    for await (const part of completions(context, options)) {
      if (part.type == 'end') {
        return []; // No tool calls
      } else if (part.type == 'tool') {
        return part.calls;
      } else {
        throw new Error('tool completions do not support text output');
      }
    }
    throw new Error('missing end part');
  };
}

export function tokenCounterForModel(model: string): TokenCounterService {
  const counter = tokenCounters[model];
  if (!counter) {
    throw new Error(`model ${model} not found`);
  }
  return counter;
}

export function metadataForModel(model: string): ModelMetadata {
  const meta = metadatas[model];
  if (!meta) {
    throw new Error(`model ${model} not found`);
  }
  return meta;
}

export function registerService(
  id: string,
  completions: CompletionService,
  tokenCounter: TokenCounterService,
  metadata: ModelMetadata,
) {
  services[id] = completions;
  tokenCounters[id] = tokenCounter;
  metadatas[id] = metadata;
}

// Load model definitions
import './impl/models';
import { TokenCounterService } from './tokenization';
import { JSONSchemaType } from 'ajv';
