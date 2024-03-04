import { signal } from '@preact/signals';
import { responses } from './types';
import { components } from '../generated/engram';

// FIXME make backend export name as ChatEngine, this is not good
export const engines = signal<responses['Omit_ChatEngine.preHandlers_'][]>([]);
export const engineMap = signal<
  Map<string, responses['Omit_ChatEngine.preHandlers_']>
>(new Map());

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

export const pendingAttachments = signal<components['schemas']['FileUpload'][]>(
  [],
);
