export type BatchEmbedder = (...texts: string[]) => Promise<number[][]>;

export function createEmbedder(
  endpoint: string,
  apiKey: string,
): BatchEmbedder {
  return async (...texts) => {
    const response = await fetch(`${endpoint}/embeddings`, {
      method: 'POST',
      body: JSON.stringify({ inputs: texts }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = (await response.json()) as { embeddings: number[][] };
    return result.embeddings;
  };
}

export class EmbedCluster {
  private embedders: BatchEmbedder[];

  constructor(
    endpoints: string[],
    apiKey: string,
    private chunksPerCall: number,
  ) {
    this.embedders = endpoints.map((endpoint) =>
      createEmbedder(endpoint, apiKey),
    );
  }

  async embed(chunks: string[]) {
    const positionals = chunks.map((text, index) => ({ text, index }));
    const vectors: number[][] = [];

    // Let each GPU process chunks as fast as they can in parallel
    const processors: Promise<void>[] = [];
    for (const embedder of this.embedders) {
      processors.push(
        (async () => {
          nextChunks: for (;;) {
            const next = positionals.splice(0, this.chunksPerCall);
            if (next.length > 0) {
              let result: number[][];
              // Try to embed a few times, there may be network errors thanks to Runpod...
              for (let fails = 0; fails < 5; fails++) {
                try {
                  result = await embedder(...next.map((n) => n.text));
                } catch (_e) {
                  console.warn(
                    'Embedding failure, trying again in 3 seconds...',
                  );
                  await new Promise((res) => setTimeout(res, 3000));
                  continue;
                }
                for (let i = 0; i < next.length; i++) {
                  vectors[next[i].index] = result[i];
                }
                continue nextChunks;
              }

              // Embedding failed too many times, this processor is probably unhealthy
              console.error('Embedder failed too many times, disabling it!');
              positionals.push(...next); // Let someone else take it
              break;
            } else {
              break;
            }
          }
        })(),
      );
    }
    await Promise.all(processors);

    return vectors;
  }
}
