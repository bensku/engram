import { Tool } from '../core';

export function getSortedArgs(
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
