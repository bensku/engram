export type TranscriptionService = (
  audio: ArrayBuffer,
  language?: string,
) => Promise<string>;
