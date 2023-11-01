import { signal } from '@preact/signals';
import { responses } from './types';

export const engines = signal<responses['ChatEngine'][]>([]);
export const engineMap = signal<Map<string, responses['ChatEngine']>>(
  new Map(),
);

export const currentTopic = signal<Partial<responses['Topic']>>({});
