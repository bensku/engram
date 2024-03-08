import Router from '@koa/router';
import Application, { Request } from 'koa';
import * as passport from 'koa-passport';
import {
  Issuer,
  Strategy,
  StrategyVerifyCallbackUserInfo,
} from 'openid-client';
import { db } from './db/core';
import { eq } from 'drizzle-orm';
import { user } from './db/schema';
import session from 'koa-session';

export class ForbiddenError extends Error {}

export interface UserDetails {
  id: number;
}

export const AUTH_ENABLED =
  process.env.NODE_ENV != 'dev' || process.env.OIDC_TESTING == 'true';

export function koaAuthentication(
  request: Request,
  _securityName: string,
  _scopes?: string[],
): Promise<UserDetails> {
  if (!AUTH_ENABLED) {
    // Local development mode
    return Promise.resolve({
      id: 0,
    });
  } else {
    // Production authentication
    if (request.ctx.isAuthenticated()) {
      // Pull user id from session
      const user = request.ctx.state.user as UserDetails;
      return Promise.resolve({ id: user.id });
    } else {
      // Redirect to login page
      request.ctx.throw(401, 'Unauthorized');
    }
  }
}

const verify: StrategyVerifyCallbackUserInfo<UserDetails> = (
  _tokenSet,
  userinfo,
  done,
) => {
  // This function shouldn't return anything, so use IIFE for async code
  // Completion uses done callback, so this is safe
  void (async () => {
    const result = await db.query.user.findFirst({
      where: eq(user.ssoId, userinfo.sub),
    });
    let id: number;
    if (result) {
      // Account found, sign in...
      id = result.id;
    } else {
      // Account is new to us, add it to database
      id = (
        await db
          .insert(user)
          .values({
            name: userinfo.name ?? 'engram user', // Keycloak has this
            ssoId: userinfo.sub,
          })
          .returning({ id: user.id })
      )[0].id;
    }
    done(null, { id });
  })();
};

export async function initializeOidcAuth(
  app: Application,
  router: Router,
  appUrl: string,
  idpUrl: string,
  clientId: string,
  clientSecret: string,
) {
  // Initialize koa-session
  app.use(session({ key: 'engram.session', signed: true }, app));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user (=only user id) as it is
  passport.serializeUser((user, done) => done(null, (user as UserDetails).id));
  passport.deserializeUser((obj, done) => done(null, { id: obj as number }));

  const oidcIssuer = await Issuer.discover(idpUrl);
  const client = new oidcIssuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [`${appUrl}/api/auth/callback`],
    response_types: ['code'],
  });

  passport.use('oidc', new Strategy<UserDetails>({ client }, verify));

  // Passport provides middlewares for auth endpoints, so don't use TSOA for this!
  router.get('/auth/login', passport.authenticate('oidc'));
  router.get(
    '/auth/callback',
    passport.authenticate('oidc', {
      successRedirect: '/',
      failureRedirect: '/api/auth/login',
    }),
  );

  router.get('/auth/logout', async (ctx) => {
    await ctx.logout();
    ctx.redirect('/');
  });
}
