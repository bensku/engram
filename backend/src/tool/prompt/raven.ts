import { ToolCall } from '../call';
import { Tool } from '../core';
import { ToolParser, ToolPromptSource } from './api';
import { getSortedArgs } from './util';

export class RavenPromptSource implements ToolPromptSource {
  systemPrompt(tools: Tool<object>[]): string {
    return 'You also have access to several external tools. They will be called automatically when needed.';
  }
  toolToPrompt(tool: Tool<object>): string {
    return `Function:
def ${tool.name}():
    """
    ${tool.description}

    Args:
    ${getSortedArgs(tool)
      .map(
        ([name, arg]) =>
          `${name} (${pythonType(arg.type)}): ${arg.description}`,
      )
      .join('\n    ')}

    Returns:
    str: ${tool.result}
    """`;
  }
  newParser(): ToolParser {
    return new RavenParser();
  }
  stringifyCall(call: ToolCall): string {
    const args = Object.entries(call.arguments);
    args.sort(([a], [b]) => (a < b ? -1 : 1));
    return `${call.tool}(${args
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
      .join(', ')})`;
  }
  toolMessage(calls: ToolCall[]): string {
    // TODO include call ids?
    return `Let call a few tools...
   
\`\`\`python
${calls.map((call) => this.stringifyCall(call)).join('\n')}
\`\`\``;
  }
}

function pythonType(type: string) {
  switch (type) {
    case 'string':
      return 'str';
    case 'number':
      return 'float';
    case 'array':
      return 'list'; // TODO member types?
    default:
      throw new Error('unsupported operation');
  }
}

class RavenParser implements ToolParser {
  private text = '';

  append(part: string): string {
    // Assume that everything is part of the tool calls
    this.text += part;
    return '';
  }
  parse(): ToolCall[] {
    // TODO support nested calls?
    const lines = this.text.substring('Call: '.length).split('\n');
    console.log(lines);
    return lines
      .map((line) => {
        const argStart = line.indexOf('(');
        const name = line.substring(0, argStart);
        const args: Record<string, unknown> = {};
        line
          .substring(argStart + 1, line.length - 1)
          .split(',') // FIXME commas in strings!
          .map((s) => s.trim().split('='))
          .forEach(([name, value]) => (args[name] = parseArgValue(value)));
        return {
          id: '',
          tool: name,
          arguments: args,
        };
      })
      .filter((call) => call.tool != 'no_op');
  }
}

function parseArgValue(str: string): unknown {
  return JSON.parse(str.replaceAll("'", '"')); // TODO terrible hack, but does it work?
}

// Note:
// Edit this question so that it can be understood without context: "What caused it?"
