/// <reference types="@cloudflare/workers-types" />

export interface Env {
  /** Base de datos D1 (binding definido en wrangler.toml). */
  DB: D1Database;
  /** Archivos estaticos de la PWA (dist/). */
  ASSETS: Fetcher;
  /** URL publica de la app, sin barra final. Ej: https://bikepacking.tuscuenta.workers.dev */
  APP_URL: string;
  /** Client ID de Google OAuth (publico). Vacio = OAuth deshabilitado. */
  GOOGLE_CLIENT_ID: string;
  /** Client secret de Google OAuth. SECRETO: solo en Cloudflare / .dev.vars. */
  GOOGLE_CLIENT_SECRET: string;
  /** Clave para firmar las cookies de sesion (HMAC). SECRETO. */
  SESSION_SECRET: string;
}
