import { DefaultContext, Next } from 'koa';

export class ForbiddenError extends Error {}

export class NotFoundError extends Error {}

export async function responseErrorHandler(ctx: DefaultContext, next: Next) {
  try {
    await next();
  } catch (e) {
    if (e instanceof ForbiddenError) {
      ctx.status = 403;
    } else if (e instanceof NotFoundError) {
      ctx.status = 404;
    } else {
      throw e;
    }
  }
}
