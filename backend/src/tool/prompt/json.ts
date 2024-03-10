import { ToolCall } from '../call';
import { Tool } from '../core';
import { ToolParser, ToolPromptSource } from './api';
import { getSortedArgs } from './util';

export class JsonPromptSource implements ToolPromptSource {
  systemPrompt(tools: Tool<object>[]): string {
    return `You have access to several external tools, which can be used to retrieve information or perform actions. Here are definitions of the tools in YAML format:
${tools.map((tool) => this.toolToPrompt(tool)).join('\n')}

Based on the earlier conversation, you should decide which (if any) of these tools you want to call. If needed, some tools can be called more than once. Format your reply as a JSON array, like this:
{
  "calls": [
    {
      "tool_name": "tool_name",
      "arguments": {
        "arg_name": "Argument value",
        "another_arg": "Another value"
      }
    },
    {
      "tool_name": "another_tool",
      "arguments": {
        "argument": "Value"
      }
    }
  ]
}

In any case, your reply should ONLY contain the JSON data.

Tool call specification:`;
  }

  toolToPrompt(tool: Tool<object>): string {
    return `${tool.name}:
  tool_name: ${tool.name}
  description: ${tool.description}
  arguments:
    ${getSortedArgs(tool)
      .map(([name, { description }]) => `${name}: ${description}`)
      .join('\n  ')}
  result: ${tool.result}`;
  }

  newParser(): ToolParser {
    return new JsonToolParser();
  }

  stringifyCall(call: ToolCall): string {
    return `{
  "tool_name": "${call.tool}",
  "arguments": {
    ${Object.entries(call.arguments)
      .map(([name, value]) => `"${name}": "${value as string}"`)
      .join('\n    ')}
  }
}`;
  }

  toolMessage(calls: ToolCall[]): string {
    // TODO improve format to match systemPrompt example?
    return `${calls.map((call) => this.stringifyCall(call)).join('\n')}`;
  }
}

class JsonToolParser implements ToolParser {
  private text = '';

  append(part: string): string {
    // TODO support passing through non-call arguments
    this.text += part;
    return '';
  }
  parse(): ToolCall[] {
    const jsonStart = this.text.indexOf('{');
    const jsonEnd = this.text.lastIndexOf('}');
    const callText = this.text
      .substring(jsonStart, jsonEnd + 1)
      .replaceAll('\\', '');
    const callData = JSON.parse(callText) as CallList;
    if (!callData.calls) {
      return []; // No calls?
    }
    return callData.calls.map((call) => ({
      id: Date.now().toString(),
      tool: call.tool_name,
      arguments: call.arguments,
    }));
  }
}

interface CallList {
  calls: CallData[];
}

interface CallData {
  tool_name: string;
  arguments: Record<string, string>;
}
