import { describe, it, expect, beforeEach } from 'vitest';
import { env, applyD1Migrations } from 'cloudflare:test';
import { issueToken, consumeToken } from '../../app/lib/server/tokens';

describe('one-time tokens', () => {
  beforeEach(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    await env.DB.exec(`DELETE FROM one_time_tokens`);
    await env.DB.exec(`DELETE FROM users`);
    await env.DB
      .prepare(
        `INSERT INTO users (id, email, name, role, status, mfa_enabled, failed_login_count, created_at, updated_at)
         VALUES ('u1', 'a@b.com', 'A', 'user', 'pending', 0, 0, 1, 1)`,
      )
      .run();
  });

  it('발급 → 소비 → 재사용 차단', async () => {
    const raw = await issueToken(env.DB, { userId: 'u1', purpose: 'pw_reset', ttlMs: 60_000 });
    const r1 = await consumeToken(env.DB, raw, 'pw_reset');
    expect(r1).toEqual({ userId: 'u1' });
    const r2 = await consumeToken(env.DB, raw, 'pw_reset');
    expect(r2).toEqual({ error: 'already_used' });
  });

  it('만료 토큰 거부', async () => {
    const raw = await issueToken(env.DB, { userId: 'u1', purpose: 'email_verify', ttlMs: -1 });
    const r = await consumeToken(env.DB, raw, 'email_verify');
    expect(r).toEqual({ error: 'expired' });
  });

  it('purpose 불일치 거부', async () => {
    const raw = await issueToken(env.DB, { userId: 'u1', purpose: 'pw_reset', ttlMs: 60_000 });
    const r = await consumeToken(env.DB, raw, 'email_verify');
    expect(r).toEqual({ error: 'purpose_mismatch' });
  });

  it('없는 토큰', async () => {
    const r = await consumeToken(env.DB, 'nonexistent', 'pw_reset');
    expect(r).toEqual({ error: 'not_found' });
  });
});
