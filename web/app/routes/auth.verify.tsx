import { Link } from 'react-router';
import type { Route } from './+types/auth.verify';
import { AuthShell } from '../components/AuthShell';
import { consumeToken } from '../lib/server/tokens';
import { audit } from '../lib/server/auth';

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return { ok: false, msg: '토큰이 없습니다.' };
  const r = await consumeToken(env.DB, token, 'email_verify');
  if (r.error) {
    return { ok: false, msg: '인증 링크가 만료되었거나 이미 사용되었습니다.' };
  }
  const now = Date.now();
  await env.DB
    .prepare(`UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, r.userId)
    .run();
  await audit(env.DB, { user_id: r.userId, action: 'email.verify' });
  return { ok: true, msg: '이메일이 인증되었습니다.' };
}

export default function Verify({ loaderData }: Route.ComponentProps) {
  return (
    <AuthShell title={loaderData.ok ? '인증 완료' : '인증 실패'}>
      <p className="text-[14px] text-ink-600">{loaderData.msg}</p>
      <p className="mt-4 text-[13px]">
        <Link to="/login" className="underline text-ink-700">로그인으로</Link>
      </p>
    </AuthShell>
  );
}
