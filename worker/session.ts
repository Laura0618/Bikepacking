// Sesiones sin estado: cookie firmada con HMAC-SHA256.
//
// Formato del token:  <payload-b64url>.<firma-b64url>
// payload = JSON { uid, exp }  (exp en segundos epoch)
//
// Ventaja: no requiere tabla de sesiones. Coste: no hay revocacion inmediata
// (el logout borra la cookie; un token robado vale hasta `exp`). Para revocacion
// real se anadiria una tabla `sessions` con jti; la interfaz de abajo no cambia.

export interface SessionPayload {
  uid: string;
  exp: number;
}

export const SESSION_COOKIE = 'pp_session';
export const OAUTH_STATE_COOKIE = 'pp_oauth';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(sig)}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await hmacKey(secret);
    const expected = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(body)),
    );
    if (!timingSafeEqual(expected, fromBase64Url(sig))) return null;
    const parsed: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as SessionPayload).uid !== 'string' ||
      typeof (parsed as SessionPayload).exp !== 'number'
    ) {
      return null;
    }
    const payload = parsed as SessionPayload;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Genera un valor aleatorio url-safe para el parametro `state` de OAuth. */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toBase64Url(buf);
}
