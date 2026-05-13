import { signSso } from './hmac';
import type { UserRow } from './db';

export interface ProxyOptions {
  upstreamUrl: string;
  ssoSecret: string;
  fetchImpl?: typeof fetch;
}

export async function proxyToWebui(
  request: Request,
  user: UserRow,
  opts: ProxyOptions,
): Promise<Response> {
  if (user.status !== 'active') {
    return new Response('Forbidden: account not active', { status: 403 });
  }

  const url = new URL(request.url);
  const target = `${opts.upstreamUrl}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('Cookie');
  headers.delete('Host');

  const ts = Date.now();
  const payload = { email: user.email, name: user.name, role: user.role, ts };
  const sig = await signSso(opts.ssoSecret, payload);

  headers.set('X-Forwarded-Email', user.email);
  headers.set('X-Forwarded-User', user.name);
  headers.set('X-Forwarded-Groups', user.role);
  headers.set('X-Forwarded-Signature', sig);
  headers.set('X-Forwarded-Timestamp', String(ts));

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  };

  const f = opts.fetchImpl ?? fetch;
  return f(target, init);
}
