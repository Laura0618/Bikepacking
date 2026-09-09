import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../index';
import type { Env } from '../env';
import { signSession, SESSION_COOKIE } from '../session';

const SECRET = 'secreto-de-pruebas-suficientemente-largo-000000';
const APP_URL = 'https://app.example';
const DT = '2026-03-01T10:00:00.000Z';

interface Call {
  sql: string;
  binds: unknown[];
}

class FakeStmt {
  binds: unknown[] = [];
  constructor(
    readonly sql: string,
    private calls: Call[],
  ) {}
  bind(...args: unknown[]): this {
    this.binds = args;
    return this;
  }
  async first<T>(): Promise<T | null> {
    this.calls.push({ sql: this.sql, binds: this.binds });
    if (/FROM users\b/.test(this.sql)) {
      return { id: this.binds[0], email: 'u@example.com', name: 'Usuaria', picture: null } as T;
    }
    return null;
  }
  async all<T>(): Promise<{ results: T[] }> {
    this.calls.push({ sql: this.sql, binds: this.binds });
    return { results: [] };
  }
  async run(): Promise<{ success: boolean }> {
    this.calls.push({ sql: this.sql, binds: this.binds });
    return { success: true };
  }
}

class FakeDB {
  calls: Call[] = [];
  prepare(sql: string): FakeStmt {
    return new FakeStmt(sql, this.calls);
  }
  async batch(stmts: FakeStmt[]): Promise<unknown[]> {
    for (const s of stmts) this.calls.push({ sql: s.sql, binds: s.binds });
    return [];
  }
}

function makeEnv(db = new FakeDB()): { env: Env; db: FakeDB } {
  const env = {
    DB: db,
    ASSETS: { fetch: async () => new Response('asset') },
    APP_URL,
    GOOGLE_CLIENT_ID: 'cid',
    GOOGLE_CLIENT_SECRET: 'csecret',
    SESSION_SECRET: SECRET,
  } as unknown as Env;
  return { env, db };
}

async function cookieFor(uid: string): Promise<string> {
  const token = await signSession(
    { uid, exp: Math.floor(Date.now() / 1000) + 3600 },
    SECRET,
  );
  return `${SESSION_COOKIE}=${token}`;
}

function workoutRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'w1',
    date: '2026-03-01',
    plannedDurationMinutes: 60,
    actualDurationMinutes: 58,
    workoutType: 'suave',
    intensity: 'suave',
    loadKg: 0,
    notes: '',
    status: 'completed',
    fromPlan: false,
    updatedAt: DT,
    deletedAt: null,
    ...over,
  };
}

function syncBody(workouts: Record<string, unknown>[] = []): string {
  return JSON.stringify({
    settings: null,
    workouts,
    strengthSessions: [],
    milestones: [],
    tombstones: [],
  });
}

function req(path: string, init: RequestInit = {}): Request {
  return new Request(`${APP_URL}${path}`, init);
}

let counter = 0;
function freshUid(): string {
  counter += 1;
  return `RL-user-${counter}-${Date.now()}`;
}

describe('API del Worker', () => {
  let env: Env;
  let db: FakeDB;
  beforeEach(() => {
    ({ env, db } = makeEnv());
  });

  it('POST /api/sync sin sesion -> 401 y Cache-Control: no-store', async () => {
    const res = await worker.fetch(
      req('/api/sync', { method: 'POST', headers: { origin: APP_URL }, body: syncBody() }),
      env,
    );
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('unauthenticated');
  });

  it('POST /api/sync desde origen no permitido -> 403 bad_origin', async () => {
    const res = await worker.fetch(
      req('/api/sync', {
        method: 'POST',
        headers: { cookie: await cookieFor('U1'), origin: 'https://evil.example', 'content-type': 'application/json' },
        body: syncBody(),
      }),
      env,
    );
    expect(res.status).toBe(403);
    expect((await res.json() as { code: string }).code).toBe('bad_origin');
  });

  it('POST /api/auth/logout desde origen ajeno -> 403', async () => {
    const res = await worker.fetch(
      req('/api/auth/logout', { method: 'POST', headers: { origin: 'https://evil.example' } }),
      env,
    );
    expect(res.status).toBe(403);
  });

  it('POST /api/sync con sesion y mismo origen -> 200 y no-store', async () => {
    const res = await worker.fetch(
      req('/api/sync', {
        method: 'POST',
        headers: {
          cookie: await cookieFor('U1'),
          'sec-fetch-site': 'same-origin',
          'content-type': 'application/json',
        },
        body: syncBody([workoutRow()]),
      }),
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('POST /api/sync con enum invalido -> 400 bad_payload', async () => {
    const res = await worker.fetch(
      req('/api/sync', {
        method: 'POST',
        headers: {
          cookie: await cookieFor('U1'),
          'sec-fetch-site': 'same-origin',
          'content-type': 'application/json',
        },
        body: syncBody([workoutRow({ workoutType: 'teletransporte' })]),
      }),
      env,
    );
    expect(res.status).toBe(400);
    expect((await res.json() as { code: string }).code).toBe('bad_payload');
  });

  it('GET /api/config responde con Cache-Control: no-store', async () => {
    const res = await worker.fetch(req('/api/config'), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('toda lectura de /api/sync filtra por el uid de la cookie', async () => {
    const uid = 'ISO-user-1';
    await worker.fetch(
      req('/api/sync', { headers: { cookie: await cookieFor(uid), 'sec-fetch-site': 'same-origin' } }),
      env,
    );
    const dataCalls = db.calls.filter((c) => /WHERE user_id = \?1/.test(c.sql));
    expect(dataCalls.length).toBeGreaterThan(0);
    for (const c of dataCalls) expect(c.binds[0]).toBe(uid);
  });

  it('rate limiting: /api/sync corta tras 120 peticiones por minuto', async () => {
    const uid = freshUid();
    const headers = { cookie: await cookieFor(uid), 'sec-fetch-site': 'same-origin' };
    let last = 200;
    for (let i = 0; i < 121; i += 1) {
      const res = await worker.fetch(req('/api/sync', { headers }), env);
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
