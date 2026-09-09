// Ayudantes HTTP para el Worker.

const NO_STORE = 'no-store';

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': NO_STORE,
      ...headers,
    },
  });
}

export function errorJson(message: string, status: number, code?: string): Response {
  return json({ error: message, code: code ?? null }, status);
}

export function redirect(location: string, headers: HeadersInit = {}): Response {
  return new Response(null, {
    status: 302,
    headers: { location, 'cache-control': NO_STORE, ...headers },
  });
}

/** Fuerza `Cache-Control: no-store` en cualquier respuesta de la API. */
export function withNoStore(res: Response): Response {
  if (res.headers.get('cache-control') === NO_STORE) return res;
  const headers = new Headers(res.headers);
  headers.set('cache-control', NO_STORE);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** Lee y parsea JSON del cuerpo; devuelve null si no es un objeto valido. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconocida'
  );
}

/**
 * True si la peticion procede del propio origen de la app (`APP_URL`).
 * Se usa como defensa CSRF en los POST que mutan estado, ademas de `SameSite=Lax`.
 * Prioriza `Sec-Fetch-Site`; si no esta, compara `Origin` y luego `Referer`.
 * Sin ninguna de esas cabeceras -> se rechaza.
 */
export function isSameOrigin(request: Request, appUrl: string): boolean {
  let expected: string;
  try {
    expected = new URL(appUrl).origin;
  } catch {
    return false;
  }

  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite) {
    return secFetchSite === 'same-origin' || secFetchSite === 'none';
  }

  const origin = request.headers.get('origin');
  if (origin) return origin === expected;

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }

  return false;
}
