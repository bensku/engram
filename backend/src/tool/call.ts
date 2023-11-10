import Ajv from 'ajv';
import { getTools } from './core';

export interface ToolCall {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolRequest {
  /**
   * Text to show to user when the call is in progress.
   */
  callTitle: string;

  /**
   * If set, the user is prompted to allow or deny the tool call with this
   * message.
   * TODO
   */
  permissionPrompt?: string;
}

export interface ToolFailure {
  error: string;
}

export interface ToolResult {
  /**
   * Tool message that should be added to LLM context.
   */
  message: string;
}

const ajv = new Ajv();

export async function checkToolUsage(
  call: ToolCall,
): Promise<ToolRequest | ToolFailure> {
  const tool = getTools().get(call.tool);
  if (!tool) {
    return { error: `Tool ${call.tool} does not exist.` };
  }

  // Validate tool arguments
  if (!ajv.validate(tool.argsSchema, call.arguments)) {
    return { error: 'Invalid tool arguments' };
  }

  return tool.preHandler(call.arguments);
}

export async function invokeTool(
  call: ToolCall,
): Promise<ToolResult | ToolFailure> {
  const tool = getTools().get(call.tool);
  if (!tool) {
    return { error: `Tool ${call.tool} does not exist.` };
  }
  return tool.handler(call.arguments);
}
