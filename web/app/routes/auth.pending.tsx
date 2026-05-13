import { Link, redirect } from 'react-router';
import type { Route } from './+types/auth.pending';
import { AuthShell } from '../components/AuthShell';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (user?.status === 'active') return redirect('/');
  return { email: user?.email ?? null };
}

export default function Pending({ loaderData }: Route.ComponentProps) {
  return (
    <AuthShell title="승인 대기 중" subtitle="가입이 접수되었습니다">
      <p className="text-[14px] text-ink-600 leading-relaxed">
        {loaderData.email && (
          <>
            가입 이메일 <b>{loaderData.email}</b> 로{' '}
          </>
        )}
        관리자 승인이 완료되면 로그인할 수 있습니다. 평균 1~2 영업일 소요됩니다.
      </p>
      <p className="mt-4 text-[13px] text-ink-500">
        <Link to="/logout" className="underline">로그아웃</Link>
      </p>
    </AuthShell>
  );
}
