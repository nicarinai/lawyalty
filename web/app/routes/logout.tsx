import { redirect } from 'react-router';
import type { Route } from './+types/logout';
import { audit, revokeSession } from '../lib/server/auth';
import { buildClearSessionCookie, readSessionCookie } from '../lib/server/session';

export async function loader() {
  return redirect('/login');
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  if (token) {
    await revokeSession(env.DB, token);
    await audit(env.DB, {
      user_id: null,
      action: 'logout',
      ip: request.headers.get('CF-Connecting-IP'),
      user_agent: request.headers.get('User-Agent'),
    });
  }
  const isProd = (env.PUBLIC_APP_URL ?? '').startsWith('https://');
  return redirect('/login', {
    headers: {
      'Set-Cookie': buildClearSessionCookie({
        secure: isProd,
        domain: isProd ? '.lawyalty.com' : undefined,
      }),
    },
  });
}
