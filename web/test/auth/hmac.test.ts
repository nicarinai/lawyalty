import { describe, it, expect } from 'vitest';
import { signSso, verifySso } from '../../app/lib/server/hmac';

const SECRET = 'test-secret-32-bytes-xxxxxxxxxxxxxxxx';

describe('signSso / verifySso', () => {
  it('서명/검증 라운드트립', async () => {
    const payload = { email: 'a@b.com', name: 'A', role: 'lawyer', ts: 1700000000000 };
    const sig = await signSso(SECRET, payload);
    expect(await verifySso(SECRET, payload, sig)).toBe(true);
  });

  it('payload 변조 시 거부', async () => {
    const payload = { email: 'a@b.com', name: 'A', role: 'lawyer', ts: 1700000000000 };
    const sig = await signSso(SECRET, payload);
    const tampered = { ...payload, role: 'admin' };
    expect(await verifySso(SECRET, tampered, sig)).toBe(false);
  });

  it('길이 다른 sig 는 false', async () => {
    const payload = { email: 'a@b.com', name: 'A', role: 'user', ts: 1700000000000 };
    expect(await verifySso(SECRET, payload, 'short')).toBe(false);
  });
});
