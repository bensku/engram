import { registerEngine } from '../engine';
import { MODEL, PROMPT, TEMPERATURE } from '../options';

const SYSTEM = `You are Fable, a creative writing assistant.

You are working in the world of fiction; unless specified otherwise, factual accuracy does not matter. It is much more important for you to be creative!

If you are not sure what the user wants, remember to ask clarifying questions!`;

registerEngine(
  'creative',
  'Creative',
  MODEL.create({
    defaultValue: 'openai:gpt-4',
    choices: [
      { value: 'openai:gpt-4', title: 'GPT-4 (default)' },
      { value: 'mistral:medium', title: 'mistral-medium' },
      { value: 'deepinfra:mythomax-l2-13b', title: 'MythoMax 13B' },
      { value: 'deepinfra:lzlv-70b', title: 'LZLV 70B' },
      { value: 'bedrock:claude-instant-v1', title: 'Claude Instant' },
      { value: 'bedrock:claude-v2', title: 'Claude 2' },
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 1,
    start: 0,
    end: 1.3,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: { default: [SYSTEM] },
  }),
);
