import api, { registerAuthLogout, registerTokenGetter, setStoredTokenFlag } from '../../api/client';
import MockAdapter from 'axios-mock-adapter';

// Apply mock to the exact api instance used in production
const mock = new MockAdapter(api);

beforeEach(() => {
  localStorage.clear();
  mock.reset();
  // Reset module-level callbacks + stored-token flag to known state before each test
  registerAuthLogout(() => {});
  registerTokenGetter(() => null);
  setStoredTokenFlag(false);
});

afterAll(() => {
  mock.restore();
});

// ── SC-07: stored token → Authorization header attached ───────────────────────

test('SC-07 stored token is attached as Authorization header', async () => {
  localStorage.setItem('auth_token', 'real-jwt-token');
  mock.onGet('/classes').reply(200, { items: [] });

  await api.get('/classes');

  const headers = mock.history.get[0].headers as Record<string, string>;
  expect(headers['Authorization']).toBe('Bearer real-jwt-token');
});

// ── SC-08: no stored token, Zustand token → header still attached ─────────────

test('SC-08 in-memory Zustand token is used when storage is empty', async () => {
  // Storage empty — demo mode
  registerTokenGetter(() => 'demo-12345678');
  mock.onGet('/classes').reply(200, { items: [] });

  await api.get('/classes');

  const headers = mock.history.get[0].headers as Record<string, string>;
  expect(headers['Authorization']).toBe('Bearer demo-12345678');
});

// ── SC-09: no token anywhere → no Authorization header ────────────────────────

test('SC-09 no token at all means no Authorization header', async () => {
  // Both storage and Zustand empty
  mock.onGet('/classes').reply(200, { items: [] });

  await api.get('/classes');

  const headers = mock.history.get[0].headers as Record<string, string>;
  expect(headers['Authorization']).toBeUndefined();
});

// ── SC-10: 401 + stored real token → clear storage + call logout ──────────────

test('SC-10 401 with stored token clears storage and fires logout callback', async () => {
  // Real session: token persisted AND flag set (as login/loadMe do in production)
  localStorage.setItem('auth_token', 'real-jwt-token');
  setStoredTokenFlag(true);
  const onLogout = jest.fn();
  registerAuthLogout(onLogout);

  mock.onGet('/classes').reply(401);

  await expect(api.get('/classes')).rejects.toMatchObject({ response: { status: 401 } });

  expect(localStorage.getItem('auth_token')).toBeNull();
  expect(onLogout).toHaveBeenCalledTimes(1);
});

// ── SC-11: 401 + no stored token (demo mode) → no redirect ────────────────────

test('SC-11 401 without stored token does not fire logout callback', async () => {
  // Demo token only in memory, not in storage
  registerTokenGetter(() => 'demo-12345678');
  const onLogout = jest.fn();
  registerAuthLogout(onLogout);

  mock.onGet('/classes').reply(401);

  await expect(api.get('/classes')).rejects.toMatchObject({ response: { status: 401 } });

  expect(localStorage.getItem('auth_token')).toBeNull();
  expect(onLogout).not.toHaveBeenCalled();
});

// ── SC-12: non-401 errors propagate without touching storage ──────────────────

test('SC-12 500 error does not clear stored token or call logout', async () => {
  localStorage.setItem('auth_token', 'real-jwt-token');
  const onLogout = jest.fn();
  registerAuthLogout(onLogout);

  mock.onGet('/classes').reply(500);

  await expect(api.get('/classes')).rejects.toMatchObject({ response: { status: 500 } });

  expect(localStorage.getItem('auth_token')).toBe('real-jwt-token');
  expect(onLogout).not.toHaveBeenCalled();
});
