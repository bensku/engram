import { signal } from '@preact/signals';
import { responses } from './types';

export const engines = signal<responses['ChatEngine'][]>([]);
export const engineMap = signal<Map<string, responses['ChatEngine']>>(
  new Map(),
);

export const topics = signal<responses['Topic'][]>([]);
export const currentTopic = signal<Partial<responses['Topic']>>({});
export const pendingMessage = signal<{
  content: string;
  format: string;
} | null>(null);

export const speechInputEnabled = signal<boolean>(false);
export const speechInputHandler = signal<((binaryStr: string) => void) | null>(
  null,
);
