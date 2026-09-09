import { describe, expect, it } from 'vitest';
import { applyPush, getSnapshot, incomingWins } from '../db';
import type { Env } from '../env';
import type { ValidPush } from '../validate';

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

function fakeEnv(): { env: Env; db: FakeDB } {
  const db = new FakeDB();
  return { env: { DB: db } as unknown as Env, db };
}

const ISO = '2026-03-01T10:00:00.000Z';

describe('incomingWins (politica de conflictos)', () => {
  it('gana el entrante si no hay fila previa', () => {
    expect(incomingWins(ISO, undefined)).toBe(true);
  });
  it('gana el entrante solo si es mas reciente', () => {
    expect(incomingWins('2026-03-02T00:00:00.000Z', ISO)).toBe(true);
    expect(incomingWins('2026-02-28T00:00:00.000Z', ISO)).toBe(false);
  });
});

describe('aislamiento por usuario', () => {
  it('getSnapshot filtra siempre por user_id y lo pasa como primer bind', async () => {
    const { env, db } = fakeEnv();
    await getSnapshot(env, 'USER-A');
    expect(db.calls.length).toBeGreaterThan(0);
    for (const call of db.calls) {
      expect(call.sql).toContain('user_id = ?1');
      expect(call.binds[0]).toBe('USER-A');
    }
  });

  it('applyPush escribe solo filas del usuario indicado', async () => {
    const { env, db } = fakeEnv();
    const push: ValidPush = {
      settings: null,
      workouts: [
        { id: 'w1', updatedAt: ISO, deletedAt: null, raw: { id: 'w1', updatedAt: ISO } },
      ],
      strengthSessions: [],
      milestones: [],
      tombstones: [{ entity: 'workout', id: 'w2', deletedAt: ISO }],
    };
    const result = await applyPush(env, 'USER-B', push);
    expect(result.applied).toBeGreaterThan(0);
    const writes = db.calls.filter((c) => c.sql.includes('INSERT INTO'));
    expect(writes.length).toBeGreaterThan(0);
    for (const call of db.calls) {
      expect(call.binds[0]).toBe('USER-B');
      expect(call.sql).toContain('user_id');
    }
  });
});
