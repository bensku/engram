import { readLines } from '@bensku/engram-shared/src/sse';
import { operations } from '../types';
import { BASE_URL, fetcher } from './api';
import { CompletionPart } from '@bensku/engram-shared/src/types';
import { showAlert } from '../component/alert';

export const getMessages = fetcher
  .path('/message/{topicId}')
  .method('get')
  .create();

export async function* postMessage({
  topicId,
  message,
}: {
  topicId: number;
  message: operations['PostAndGetReply']['requestBody']['content']['application/json'];
}) {
  const response = await fetch(`${BASE_URL}/message/${topicId}`, {
    method: 'POST',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.body) {
    showAlert('error', 'Server error: ' + response.statusText);
    return;
  }
  const reader = response.body.getReader();
  for await (const line of readLines(reader)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data:')) {
      yield JSON.parse(trimmed.substring('data:'.length)) as CompletionPart;
    } // else: ignore
  }
}

export const updateMessage = fetcher
  .path('/message/{messageId}')
  .method('put')
  .create();

export const deleteMessage = fetcher
  .path('/message/{messageId}')
  .method('delete')
  .create();
