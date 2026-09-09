// Rate limiting con interfaz abstracta para poder cambiar el backend
// (memoria -> KV con TTL -> Durable Object) sin tocar los sitios de llamada.
//
// Limitacion de la implementacion actual (MemoryRateLimiter): el mapa vive en
// cada isolate del Worker, asi que el limite real es "por isolate", no global.
// Frena abuso trivial. Para un limite global y persistente:
//   1. Implementa `RateLimiter` con un binding KV (get/put con `expirationTtl`)
//      o un Durable Object con un contador por clave.
//   2. En worker/index.ts, sustituye `limiter` por la nueva instancia.
// La firma `check()` no cambia, asi que el flujo y los tests siguen igual.

export interface RateLimitResult {
  allowed: boolean;
  /** Segundos hasta que se libera la cuota (solo informativo). */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> | RateLimitResult;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export class MemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    }
    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

/** Instancia por defecto que usa el Worker. */
export const limiter = new MemoryRateLimiter();

/** Azucar sincrono para el limitador por defecto. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  return limiter.check(key, limit, windowMs).allowed;
}

export function sweep(): void {
  limiter.sweep();
}
