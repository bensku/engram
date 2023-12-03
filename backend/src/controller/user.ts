import { Controller, Get, Request, Route, Security } from 'tsoa';
import { db } from '../db/core';
import { RequestBody } from '../types';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AUTH_ENABLED } from '../auth';

@Route('user')
export class UserController extends Controller {
  @Security('auth')
  @Get('')
  async details(@Request() req: RequestBody): Promise<User> {
    if (!AUTH_ENABLED) {
      return { name: 'Developer' };
    }

    const data = await db.query.user.findFirst({
      where: eq(user.id, req.user.id),
    });
    if (!data) {
      throw new Error(); // Should NEVER happen, because TSOA handles auth
    }
    return { name: data.name };
  }
}

export interface User {
  name: string;
}
