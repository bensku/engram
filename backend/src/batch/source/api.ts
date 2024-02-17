export interface TextChunk {
  id: string;
  text: string;
}

export type EmbedDataSource = () => AsyncGenerator<TextChunk>;
