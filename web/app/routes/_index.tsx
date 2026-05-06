import { Link, redirect } from 'react-router';
import type { Route } from './+types/_index';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (user) {
    // 로그인 상태면 webui 로
    return redirect(context.cloudflare.env.WEBUI_BASE_URL ?? '/login');
  }
  return null;
}

export default function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="liquid-glass-strong max-w-[520px] w-full p-10 rounded-[20px] text-center">
        <div className="mx-auto liquid-glass w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-2xl">⚖</span>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink-700">라윌티</h1>
        <p className="mt-2 text-[14px] text-ink-500">
          건축법·국토계획법·주택법 검토를 위한 AI 워크스페이스
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            to="/login"
            className="liquid-glass-strong h-12 rounded-lg flex items-center justify-center text-[15px] font-semibold text-ink-700 hover:[box-shadow:var(--glass-shadow-lg)] transition-shadow"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="liquid-glass h-12 rounded-lg flex items-center justify-center text-[15px] font-medium text-ink-700 hover:[border-color:var(--glass-border-active)] transition-colors"
          >
            가입 신청
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-ink-400">
          가입 후 관리자 승인을 거쳐 시작합니다.
        </p>
      </div>
    </main>
  );
}
