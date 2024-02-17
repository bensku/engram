import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbedDataSink } from './api';
import { randomBytes } from 'crypto';

export function qdrantSink(dbUrl: string, collection: string): EmbedDataSink {
  const qdrant = new QdrantClient({ url: dbUrl });
  return async (embeddings) => {
    await qdrant.upsert(collection, {
      points: embeddings.map((embedding) => ({
        // We unfortunately can't derive stable number/UUID ids from arbitrary text chunks
        id: randomBytes(16).toString('hex'),
        vector: embedding.values,
        payload: {
          id: embedding.chunk.id,
        },
      })),
    });
  };
}

export async function clearQdrantCollection(
  dbUrl: string,
  collection: string,
): Promise<void> {
  const qdrant = new QdrantClient({ url: dbUrl });
  await qdrant.deleteCollection(collection);
  await qdrant.createCollection(collection, {});
}
