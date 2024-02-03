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
