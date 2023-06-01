import { paths } from '../../generated/engram';
import { Fetcher } from 'openapi-typescript-fetch';

export type { paths } from '../../generated/engram';

// TODO configurable base URL
export const BASE_URL = 'http://localhost:3000';

export const fetcher = Fetcher.for<paths>();
fetcher.configure({
  baseUrl: BASE_URL,
  init: {
    headers: {},
  },
  // TODO authentication
});
