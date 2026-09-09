// Worker de "Pedalea a Polonia": sirve la PWA (binding ASSETS) y la API en /api/*.
//
// Decision de arquitectura (ver README): un unico Worker con Static Assets, no
// Pages Functions, porque el repo ya se despliega como Worker con `wrangler deploy`.
// `run_worker_first = ["/api/*"]` en wrangler.toml hace que la API pase por aqui
// antes que el fallback SPA de los assets.
//
// Endurecimiento aplicado:
//  * Todas las respuestas /api/* llevan `Cache-Control: no-store` (withNoStore).
//  * Los POST que mutan (/api/sync, /api/auth/logout) exigen mismo origen (isSameOrigin).
//  * Rate limiting en /api/auth/* y en /api/sync (limiter abstracto).
//  * userId SIEMPRE sale de la cookie de sesion firmada, nunca del payload.

import { clearCookie, parseCookies, serializeCookie } from './cookies';
import { getSnapshot, getUser, getLastSync, setLastSync, upsertUser, applyPush } from './db';
import type { Env } from './env';
import { buildAuthUrl, exchangeCode, fetchProfile, isOAuthConfigured } from './google';
import {
  clientIp,
  errorJson,
  isSameOrigin,
  json,
  readJson,
  redirect,
  withNoStore,
} from './http';
import { allow, sweep } from './ratelimit';
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  randomToken,
  signSession,
  verifySession,
} from './session';
import { parseSyncPush } from './validate';
import type { SyncPushResponse } from '../src/types';

function isSecure(url: URL): boolean {
  return url.protocol === 'https:';
}

async function currentUserId(request: Request, env: Env): Promise<string | null> {
  const cookies = parseCookies(request.headers.get('cookie'));
  const payload = await verifySession(cookies[SESSION_COOKIE], env.SESSION_SECRET);
  return payload?.uid ?? null;
}

function forbiddenOrigin(): Response {
  return errorJson('Origen no permitido.', 403, 'bad_origin');
}

function tooMany(): Response {
  return errorJson('Demasiadas peticiones. Prueba en un minuto.', 429, 'rate_limited');
}

async function handleLogin(request: Request, env: Env, url: URL): Promise<Response> {
  if (!allow(`login:${clientIp(request)}`, 10, 60_000)) return tooMany();
  if (!isOAuthConfigured(env)) {
    return errorJson(
      'El inicio de sesion no esta configurado en este despliegue.',
      503,
      'oauth_not_configured',
    );
  }
  const state = randomToken();
  return redirect(buildAuthUrl(env, state), {
    'set-cookie': serializeCookie(OAUTH_STATE_COOKIE, state, {
      maxAgeSeconds: 600,
      httpOnly: true,
      secure: isSecure(url),
      sameSite: 'Lax',
    }),
  });
}

async function handleCallback(request: Request, env: Env, url: URL): Promise<Response> {
  if (!allow(`callback:${clientIp(request)}`, 20, 60_000)) return tooMany();
  if (!isOAuthConfigured(env)) return errorJson('OAuth no configurado.', 503, 'oauth_not_configured');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('cookie'));
  const expectedState = cookies[OAUTH_STATE_COOKIE];

  if (!code || !state || !expectedState || state !== expectedState) {
    return errorJson('Validacion de estado fallida. Reintenta el inicio de sesion.', 400, 'bad_state');
  }

  try {
    const accessToken = await exchangeCode(env, code);
    const profile = await fetchProfile(accessToken);
    const user = await upsertUser(env, profile);
    const token = await signSession(
      { uid: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
      env.SESSION_SECRET,
    );
    const headers = new Headers();
    headers.append(
      'set-cookie',
      serializeCookie(SESSION_COOKIE, token, {
        maxAgeSeconds: SESSION_TTL_SECONDS,
        httpOnly: true,
        secure: isSecure(url),
        sameSite: 'Lax',
      }),
    );
    headers.append('set-cookie', clearCookie(OAUTH_STATE_COOKIE, isSecure(url)));
    headers.set('location', `${env.APP_URL.replace(/\/$/, '')}/ajustes?login=ok`);
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('OAuth callback:', err);
    return redirect(`${env.APP_URL.replace(/\/$/, '')}/ajustes?login=error`);
  }
}

function handleLogout(request: Request, env: Env, url: URL): Response {
  if (!isSameOrigin(request, env.APP_URL)) return forbiddenOrigin();
  return json({ ok: true }, 200, { 'set-cookie': clearCookie(SESSION_COOKIE, isSecure(url)) });
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const uid = await currentUserId(request, env);
  if (!uid) return errorJson('No autenticado.', 401, 'unauthenticated');
  const user = await getUser(env, uid);
  if (!user) return errorJson('No autenticado.', 401, 'unauthenticated');
  return json({ user });
}

async function handleSyncGet(request: Request, env: Env): Promise<Response> {
  const uid = await currentUserId(request, env);
  if (!uid) return errorJson('No autenticado.', 401, 'unauthenticated');
  if (!allow(`sync:${uid}`, 120, 60_000)) return tooMany();

  const [snapshot, lastSyncAt] = await Promise.all([getSnapshot(env, uid), getLastSync(env, uid)]);
  return json({ ...snapshot, serverTime: new Date().toISOString(), lastSyncAt });
}

async function handleSyncPost(request: Request, env: Env): Promise<Response> {
  if (!isSameOrigin(request, env.APP_URL)) return forbiddenOrigin();

  const uid = await currentUserId(request, env);
  if (!uid) return errorJson('No autenticado.', 401, 'unauthenticated');
  if (!allow(`sync:${uid}`, 120, 60_000)) return tooMany();

  const body = await readJson(request);
  if (!body) return errorJson('Cuerpo JSON invalido.', 400, 'bad_body');
  const parsed = parseSyncPush(body);
  if (!parsed.ok) return errorJson(parsed.error, 400, 'bad_payload');

  const { conflicts } = await applyPush(env, uid, parsed.value);
  const serverTime = new Date().toISOString();
  await setLastSync(env, uid, serverTime);
  const snapshot = await getSnapshot(env, uid);

  const response: SyncPushResponse = {
    ...snapshot,
    serverTime,
    lastSyncAt: serverTime,
    conflicts,
  };
  return json(response);
}

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (pathname === '/api/health') return json({ ok: true });
  if (pathname === '/api/config') return json({ oauthConfigured: isOAuthConfigured(env) });

  if (pathname === '/api/auth/login' && method === 'GET') return handleLogin(request, env, url);
  if (pathname === '/api/auth/callback' && method === 'GET') return handleCallback(request, env, url);
  if (pathname === '/api/auth/logout' && method === 'POST') return handleLogout(request, env, url);
  if (pathname === '/api/me' && method === 'GET') return handleMe(request, env);

  if (pathname === '/api/sync' && method === 'GET') return handleSyncGet(request, env);
  if (pathname === '/api/sync' && method === 'POST') return handleSyncPost(request, env);

  return errorJson('Ruta no encontrada.', 404, 'not_found');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    sweep();
    try {
      return withNoStore(await route(request, env, url));
    } catch (err) {
      console.error('API error:', err);
      return withNoStore(errorJson('Error interno.', 500, 'internal'));
    }
  },
};
