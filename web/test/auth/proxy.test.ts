import { describe, it, expect, vi } from 'vitest';
import { proxyToWebui } from '../../app/lib/server/proxy';
import type { UserRow } from '../../app/lib/server/db';

const user: UserRow = {
  id: 'u1',
  email: 'a@b.com',
  name: 'A',
  password_hash: null,
  role: 'lawyer',
  status: 'active',
  organization: null,
  license_number: null,
  email_verified_at: null,
  phone: null,
  phone_verified_at: null,
  mfa_enabled: 0,
  mfa_secret: null,
  failed_login_count: 0,
  locked_until: null,
  created_at: 0,
  updated_at: 0,
  last_login_at: null,
};

describe('proxyToWebui', () => {
  it('업스트림에 X-Forwarded-* 헤더와 서명 주입, Cookie 제거', async () => {
    const captured: { url: string; headers: Headers } = { url: '', headers: new Headers() };
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      captured.url = url;
      captured.headers = new Headers(init.headers);
      return new Response('ok', { status: 200 });
    });

    const req = new Request('https://lawyalty.com/api/chats?x=1', {
      method: 'GET',
      headers: { Cookie: 'lawyalty_session=secret' },
    });

    const res = await proxyToWebui(req, user, {
      upstreamUrl: 'http://localhost:8080',
      ssoSecret: 'test-secret',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(res.status).toBe(200);
    expect(captured.url).toBe('http://localhost:8080/api/chats?x=1');
    expect(captured.headers.get('X-Forwarded-Email')).toBe('a@b.com');
    expect(captured.headers.get('X-Forwarded-User')).toBe('A');
    expect(captured.headers.get('X-Forwarded-Groups')).toBe('lawyer');
    expect(captured.headers.get('X-Forwarded-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(captured.headers.get('X-Forwarded-Timestamp')).toMatch(/^\d+$/);
    expect(captured.headers.get('Cookie')).toBeNull();
  });

  it('pending 상태 사용자는 403, fetch 호출 없음', async () => {
    const pending: UserRow = { ...user, status: 'pending' };
    const fetchMock = vi.fn();
    const req = new Request('https://lawyalty.com/api/chats');
    const res = await proxyToWebui(req, pending, {
      upstreamUrl: 'http://localhost:8080',
      ssoSecret: 's',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
