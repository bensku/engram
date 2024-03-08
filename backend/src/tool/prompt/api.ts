import { ToolCall } from '../call';
import { Tool } from '../core';

export interface ToolPromptSource {
  /**
   * Creates the (part of) system prompt that instructs the model how to use
   * tool calls.
   * @param tools
   */
  systemPrompt(tools: Tool<object>[]): string;

  /**
   * Converts a tool into system prompt text.
   * @param tool Tool.
   */
  toolToPrompt(tool: Tool<object>): string;

  /**
   * Creates a new tool parser for this source.
   */
  newParser(): ToolParser;

  /**
   * Converts a tool call to a string (for LLM context usage).
   * @param call The tool call.
   */
  stringifyCall(call: ToolCall): string;

  /**
   * Converts one or more tool calls to a message that could be used as context.
   * @param calls Tool calls
   */
  toolMessage(calls: ToolCall[]): string;
}

export interface ToolParser {
  /**
   * Appends a part of streamed LLM reply to this tool parser.
   * @param part Streamed LLM reply part.
   * @returns Text that is NOT part of the tool call.
   */
  append(part: string): string;

  /**
   * Parses the tool calls from previously appended text.
   */
  parse(): ToolCall[];
}
