import type { Route } from './+types/auth.me';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    organization: user.organization,
    license_number: user.license_number,
    email_verified_at: user.email_verified_at,
  });
}

