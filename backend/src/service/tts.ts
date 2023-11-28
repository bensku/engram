export type TtsService = (
  text: string,
  voice: string,
) => AsyncGenerator<Uint8Array, void, void>;
