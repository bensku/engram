import { fetcher } from './api';

export const listEngines = fetcher.path('/engine').method('get').create();
