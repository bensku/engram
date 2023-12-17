import { Message } from '../service/message';
import { TopicOptions } from '../service/topic';
import { ChatEngine } from './engine';
import { MODEL } from './options';

export type Prompt = Record<string, PromptOption> & { default: PromptOption };
type PromptOption =
  | [string, string?]
  | ((engine: ChatEngine, options: TopicOptions) => [string, string?]);

export function promptMessages(
  prompt: Prompt,
  engine: ChatEngine,
  options: TopicOptions,
): Message[] {
  let option = prompt[MODEL.getOrThrow(engine, options.options)];
  if (!option) {
    // No model-specific prompt; pick the default one
    option = prompt.default;
  }
  if (!Array.isArray(option)) {
    // If prompt is a function, execute it!
    option = option(engine, options);
  }

  // Convert prompt to messages
  const msgs: Message[] = [
    { type: 'system', id: -2, text: option[0], time: Date.now() },
  ];
  if (option[1]) {
    msgs.push({ type: 'user', id: -1, text: option[1], time: Date.now() });
  }
  return msgs;
}
