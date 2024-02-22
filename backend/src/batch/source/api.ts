export interface TextChunk {
  id: string;
  text: string;

  /**
   * Document index. Provided only for logging purposes.
   */
  docIndex?: number;
}

export type EmbedDataSource = () => AsyncGenerator<TextChunk>;
