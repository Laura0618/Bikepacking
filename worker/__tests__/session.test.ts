import { describe, expect, it } from 'vitest';
import { signSession, verifySession, randomToken } from '../session';

const SECRET = 'secreto-de-pruebas-muy-largo-1234567890';

describe('sesiones firmadas', () => {
  it('firma y verifica ida y vuelta', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = await signSession({ uid: 'user-1', exp }, SECRET);
    const payload = await verifySession(token, SECRET);
    expect(payload).toEqual({ uid: 'user-1', exp });
  });

  it('rechaza una firma manipulada', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = await signSession({ uid: 'user-1', exp }, SECRET);
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'bb' : 'aa');
    expect(await verifySession(tampered, SECRET)).toBeNull();
  });

  it('rechaza un secreto distinto', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = await signSession({ uid: 'user-1', exp }, SECRET);
    expect(await verifySession(token, 'otro-secreto')).toBeNull();
  });

  it('rechaza un token caducado', async () => {
    const token = await signSession(
      { uid: 'user-1', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET,
    );
    expect(await verifySession(token, SECRET)).toBeNull();
  });

  it('rechaza tokens vacios o mal formados', async () => {
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession('sinpunto', SECRET)).toBeNull();
  });

  it('randomToken genera valores url-safe y unicos', () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
