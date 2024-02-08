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
          for (;;) {
            const next = positionals.splice(0, this.chunksPerCall);
            if (next.length > 0) {
              const result = await embedder(...next.map((n) => n.text));
              for (let i = 0; i < next.length; i++) {
                vectors[next[i].index] = result[i];
              }
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
