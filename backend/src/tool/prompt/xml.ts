import { XMLParser } from 'fast-xml-parser';
import { ToolParser, ToolPromptSource } from './api';
import { ToolCall } from '../call';
import { Tool } from '../core';
import { getSortedArgs } from './util';

export class XmlPromptSource implements ToolPromptSource {
  systemPrompt(tools: Tool<object>[]): string {
    return `You have access to a set of tools you can use to answer the user's question or act on their behalf.

You may call them like this:
<tool_calls>
<invoke>
<tool_name>$TOOL_NAME</tool_name>
<parameters>
<$PARAMETER_NAME>$PARAMETER_VALUE</$PARAMETER_NAME>
...
</parameters>
</invoke>
</tool_calls>

Here are the tools available:
<tools>
${tools.map((tool) => this.toolToPrompt(tool)).join('\n')}
</tools>
You decide when to call tools. It is ok to call multiple tools, including calling one tool many times. It is also ok to not call any tool if they don't seem relevant.

When calling a tool, don't tell the user about it - just do it!`;
  }

  toolToPrompt(tool: Tool<object>): string {
    return `<tool>
<tool_name>${tool.name}</tool_name>
<description>${tool.description}</description>
<parameters>
${getSortedArgs(tool)
  .map(
    ([name, { type, description }]) => `<parameter>
<name>${name}</name>
<type>${type}</type>
<description>${description}</description>
</parameter>`,
  )
  .join('\n')}
</parameters>
</tool>`;
  }

  newParser(): ToolParser {
    return new XmlToolParser();
  }

  stringifyCall(call: ToolCall): string {
    return `<invoke>
<tool_name>${call.tool}</tool_name>
<parameters>
${Object.entries(call.arguments)
  .map(([name, value]) => `<${name}>${value as string}</${name}>`)
  .join('\n')}
</parameters>
</invoke>`;
  }

  toolMessage(calls: ToolCall[]): string {
    return `<tool_calls>
${calls.map((call) => this.stringifyCall(call)).join('\n')}
</tool_calls>`;
  }
}

const XML_PARSER = new XMLParser();
const START_TAG = '<tool_calls>';
const END_TAG = '</tool_calls>';
class XmlToolParser implements ToolParser {
  private buf: string;

  potentialStart: number;
  ongoingCall: boolean;
  constructor() {
    this.buf = '';
    this.potentialStart = 0;
    this.ongoingCall = false;
  }

  append(part: string): string {
    let yieldText = '';
    for (const c of part) {
      if (this.ongoingCall) {
        // Ongoing call, append to buffer
        // TODO performance?
        this.buf += c;
        if (this.buf.endsWith(END_TAG)) {
          this.ongoingCall = false;
        }
      } else if (this.potentialStart != 0) {
        if (c == START_TAG[this.potentialStart]) {
          // This still looks like start tag
          if (this.potentialStart == START_TAG.length - 1) {
            // Start the call!
            this.ongoingCall = true;
            this.potentialStart = 0; // For next set calls, if found
            this.buf += START_TAG;
          } else {
            // But it might still not be the start tag
            this.potentialStart++;
          }
        } else {
          // This can't be the start tag - return it to user
          yieldText += START_TAG.substring(0, this.potentialStart + 1);
          this.potentialStart = 0;
        }
      } else if (c == '<') {
        // Potential start of tool calls
        this.potentialStart++;
      } else {
        // Normal LLM-generated text
        yieldText += c;
      }
    }
    return yieldText;
  }

  parse(): ToolCall[] {
    if (!this.buf) {
      return [];
    }
    type Tree = {
      tool_calls: {
        invoke: {
          tool_name: string;
          parameters: Record<string, string>;
        }[];
      };
    };
    const tree = XML_PARSER.parse(this.buf) as Tree;
    let invoke = tree.tool_calls.invoke;
    if (!Array.isArray(invoke)) {
      invoke = [invoke];
    }
    return invoke.map((invoke) => ({
      id: '',
      tool: invoke.tool_name,
      arguments: invoke.parameters,
    }));
  }
}
