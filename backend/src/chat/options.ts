import { Message } from '../service/message';
import { ChatEngine } from './engine';

interface BaseEngineOption<T> {
  id: string;
  type: string;
  defaultValue: T;
  userEditable: boolean;
}

interface UnknownOption<T> extends BaseEngineOption<T> {
  type: 'unknown';
  userEditable: false;
}

interface SelectOption extends BaseEngineOption<string> {
  type: 'select';
  choices: { value: string; title: string }[];
}

interface ToggleOption extends BaseEngineOption<boolean> {
  type: 'toggle';
}

interface SliderOption extends BaseEngineOption<number> {
  type: 'slider';
  start: number;
  end: number;
}

export type EngineOption =
  | UnknownOption<unknown>
  | SelectOption
  | ToggleOption
  | SliderOption;

export class OptionType<T extends EngineOption> {
  constructor(private type: T['type'], private id: string) {}

  create(props: Omit<Omit<T, 'id'>, 'type'>): T {
    return {
      id: this.id,
      type: this.type,
      ...props,
    } as T;
  }

  get(
    engine: ChatEngine,
    overrides: EngineOption[],
  ): T['defaultValue'] | undefined {
    return (this.findOption(overrides, this.id) ??
      this.findOption(engine.options, this.id)) as
      | T['defaultValue']
      | undefined;
  }

  getOrThrow(engine: ChatEngine, overrides: EngineOption[]): T['defaultValue'] {
    const opt = this.get(engine, overrides);
    if (!opt) {
      throw new Error(`missing mandatory option ${this.id}`);
    }
    return opt;
  }

  private findOption(list: EngineOption[], id: string) {
    for (const opt of list) {
      if (opt.id == id) {
        return opt;
      }
    }
    return undefined;
  }
}

export const MODEL = new OptionType<SelectOption>('select', 'model');

export const PROMPT = new OptionType<UnknownOption<Message[]>>(
  'unknown',
  'prompt',
);

export const TEMPERATURE = new OptionType<SliderOption>(
  'slider',
  'temperature',
);
