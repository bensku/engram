import { fetcher } from './api';

export const listTopics = fetcher.path('/topic').method('get').create();

export const getTopic = fetcher.path('/topic/{id}').method('get').create();

export const updateTopic = fetcher.path('/topic/{id}').method('put').create();

export const createTopic = fetcher.path('/topic').method('post').create();

export const deleteTopic = fetcher
  .path('/topic/{id}')
  .method('delete')
  .create();
