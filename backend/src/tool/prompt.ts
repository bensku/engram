import { ToolCall } from './call';
import { Tool, getTool } from './core';

export function toolsToPrompt(tools: Tool<object>[]) {
  return tools.map((tool) => toolPrompt(tool)).join('\n');
}

function toolPrompt(tool: Tool<object>) {
  const args = getSortedArgs(tool);

  let decl = `/**
  * ${tool.description}
  *`;
  for (const [name, details] of args) {
    decl += ` * @param ${name} ${details.description}\n`;
  }
  decl += `**/
function ${tool.name}(${args
    .map(([name, details]) => `${name}: ${details.type}`)
    .join(', ')}): string;`;
  return decl;
}

function getSortedArgs(
  tool: Tool<object>,
): [string, { type: string; description: string }][] {
  const argsProps = tool.argsSchema.properties as Record<
    string,
    { type: string; description: string }
  >;
  const args = Object.entries(argsProps);
  args.sort(([a], [b]) => (a < b ? -1 : 1));
  return args;
}

export function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const line of text.split('\n')) {
    const argsStart = line.indexOf('(');
    const toolName = line.substring(0, argsStart).trim();
    if (toolName == '') {
      continue; // Probably, hopefully, empty line
    }
    const argStr = line.substring(argsStart + 1, line.length - 1);
    const argList = JSON.parse(`[${argStr}]`) as string[]; // FIXME ugly hack

    // Figure out argument names
    const toolArgs = getSortedArgs(getTool(toolName));
    const args: Record<string, string> = {};
    for (let i = 0; i < argList.length; i++) {
      args[toolArgs[i][0]] = argList[i];
    }
    calls.push({ id: '-1', tool: toolName, arguments: args });
  }
  return calls;
}
