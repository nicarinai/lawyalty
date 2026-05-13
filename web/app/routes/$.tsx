import { redirect } from 'react-router';
import type { Route } from './+types/$';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';
import { proxyToWebui } from '../lib/server/proxy';

export async function loader({ request, context }: Route.LoaderArgs) {
  return handle(request, context);
}

export async function action({ request, context }: Route.ActionArgs) {
  return handle(request, context);
}

async function handle(
  request: Request,
  context: Route.LoaderArgs['context'],
): Promise<Response> {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(env.DB, token);

  if (!user) {
    const url = new URL(request.url);
    const next = encodeURIComponent(url.pathname + url.search);
    return redirect(`/login?next=${next}`);
  }
  if (user.status === 'pending') return redirect('/auth/pending');

  return proxyToWebui(request, user, {
    upstreamUrl: env.UPSTREAM_URL,
    ssoSecret: env.SSO_SECRET,
  });
}

export default function Splat() {
  return null;
}
