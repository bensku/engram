import { paths } from '../../generated/engram';
import { Fetcher } from 'openapi-typescript-fetch';

export type { paths } from '../../generated/engram';

// TODO configurable base URL
export const BASE_URL = '/api';

export const fetcher = Fetcher.for<paths>();
fetcher.configure({
  baseUrl: BASE_URL,
  init: {
    headers: {},
    credentials: 'same-origin',
  },
  use: [
    async (url, init, next) => {
      try {
        const response = await next(url, init);
        return response;
      } catch (e) {
        if ((e as { status: number }).status == 401) {
          window.location.replace('/api/auth/login');
        }
        throw e;
      }
    },
  ],
  // TODO authentication
});
