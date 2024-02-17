import { TextChunk } from '../source/api';

export interface Embedding {
  values: number[];
  chunk: TextChunk;
}

export type EmbedDataSink = (embeddings: Embedding[]) => Promise<void>;
