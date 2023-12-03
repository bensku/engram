import { fetcher } from './api';

export const getUserDetails = fetcher.path('/user').method('get').create();
