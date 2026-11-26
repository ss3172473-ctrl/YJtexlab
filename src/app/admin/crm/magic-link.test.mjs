import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionBootstrap } from './magic-link.ts';

test('clears URL before exchanging, ignores refresh token, and exchanges once on effect replay', async () => {
  const calls = [];
  const start = createSessionBootstrap({
    location: { hash: '#access_token=example-access&refresh_token=not-retained', pathname: '/admin/crm', search: '?source=email' },
    replaceUrl: url => calls.push(['url', url]),
    exchange: async token => { calls.push(['exchange', token]); },
    readSession: async () => { calls.push(['session']); return { authenticated: true }; },
  });
  const first = start();
  assert.equal(start(), first);
  assert.deepEqual(await first, { authenticated: true });
  assert.deepEqual(calls, [['url', '/admin/crm?source=email'], ['exchange', 'example-access'], ['session']]);
});

test('provider URL errors are cleared and sanitized without exchanging a token', async () => {
  let cleared = false;
  const start = createSessionBootstrap({
    location: { hash: '#error=access_denied&error_description=secret-or-markup&access_token=bad', pathname: '/admin/crm', search: '' },
    replaceUrl: () => { cleared = true; },
    exchange: async () => assert.fail('must not exchange on error'),
    readSession: async () => assert.fail('must not read session on error'),
  });
  await assert.rejects(start(), error => !error.message.includes('secret-or-markup') && error.message.includes('새 링크'));
  assert.equal(cleared, true);
});

test('ordinary visit only reads the session and unsuccessful exchange never reads it', async () => {
  let reads = 0;
  const base = { location: { hash: '', pathname: '/admin/crm', search: '' }, replaceUrl: () => assert.fail('no fragment to clear'), exchange: async () => assert.fail('no token'), readSession: async () => { reads++; return { authenticated: false }; } };
  assert.deepEqual(await createSessionBootstrap(base)(), { authenticated: false });
  assert.equal(reads, 1);
  const broken = createSessionBootstrap({ ...base, location: { ...base.location, hash: '#access_token=rejected' }, replaceUrl: () => {}, exchange: async () => { throw new Error('Rejected'); } });
  await assert.rejects(broken(), /Rejected/);
  assert.equal(reads, 1);
});
