import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { rateLimit } from '../../app/lib/server/ratelimit';

describe('rateLimit', () => {
  it('한도 내에서 통과, 초과 시 차단', async () => {
    const key = 'test:' + Math.random();
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit(env.KV, { key, limit: 3, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
    }
    const r4 = await rateLimit(env.KV, { key, limit: 3, windowMs: 60_000 });
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
  });

  it('별도 key 는 독립', async () => {
    const k1 = 'k1:' + Math.random();
    const k2 = 'k2:' + Math.random();
    await rateLimit(env.KV, { key: k1, limit: 1, windowMs: 60_000 });
    const r = await rateLimit(env.KV, { key: k2, limit: 1, windowMs: 60_000 });
    expect(r.allowed).toBe(true);
  });
});
