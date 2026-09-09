// Google OAuth 2.0 (Authorization Code). Solo openid/email/profile.

import type { Env } from './env';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

export function isOAuthConfigured(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET);
}

export function redirectUri(env: Env): string {
  return `${env.APP_URL.replace(/\/$/, '')}/api/auth/callback`;
}

export function buildAuthUrl(env: Env, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(env),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCode(env: Env, code: string): Promise<string> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(env),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}`);
  const data: unknown = await res.json();
  const token =
    typeof data === 'object' && data !== null
      ? (data as { access_token?: unknown }).access_token
      : undefined;
  if (typeof token !== 'string') throw new Error('sin access_token');
  return token;
}

export async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo ${res.status}`);
  const data: unknown = await res.json();
  if (typeof data !== 'object' || data === null) throw new Error('userinfo vacio');
  const d = data as Record<string, unknown>;
  if (typeof d.sub !== 'string' || typeof d.email !== 'string') {
    throw new Error('userinfo incompleto');
  }
  return {
    sub: d.sub,
    email: d.email,
    name: typeof d.name === 'string' ? d.name : d.email,
    picture: typeof d.picture === 'string' ? d.picture : null,
  };
}
