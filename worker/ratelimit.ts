// Rate limiting basico por isolate para rutas de autenticacion.
//
// Limitacion conocida: cada isolate del Worker tiene su propio mapa en memoria,
// asi que el limite real es "por isolate", no global. Es suficiente para frenar
// abuso trivial. Para un limite global y persistente se usaria un binding de KV
// con TTL o un Durable Object; la firma `allow()` no cambiaria.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

// Limpieza oportunista para que el mapa no crezca sin limite.
export function sweep(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
