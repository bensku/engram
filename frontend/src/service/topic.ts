import { BASE_URL, fetcher } from './api';
import { readLines } from '@bensku/engram-shared/src/sse';
import { CompletionPart } from '@bensku/engram-shared/src/types';

export const getTopic = fetcher.path('/topic/{id}').method('get').create();

export const getMessages = fetcher
  .path('/message/{topicId}')
  .method('get')
  .create();

export async function* postMessage({
  topicId,
  message,
}: {
  topicId: string;
  message: string;
}) {
  const response = await fetch(`${BASE_URL}/message/${topicId}`, {
    method: 'POST',
    body: message,
    // TODO auth
  });
  if (!response.body) {
    throw new Error(); // TODO error handling
  }
  const reader = response.body.getReader();
  for await (const line of readLines(reader)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data:')) {
      yield JSON.parse(trimmed.substring('data:'.length)) as CompletionPart;
    } // else: ignore
  }
}
