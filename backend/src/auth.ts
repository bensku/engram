import { Request } from 'koa';

export class ForbiddenError extends Error {}

export interface UserDetails {
  id: number;
}

export function koaAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[],
): Promise<UserDetails> {
  if (process.env.NODE_ENV == 'dev') {
    return Promise.resolve({
      id: 0,
    });
  } else {
    throw new Error();
  }
}
