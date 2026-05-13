import { Form, Link, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/login';

import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import {
  audit,
  bumpFailedLogin,
  createSession,
  getSessionUser,
  resetFailedLogin,
  verifyPassword,
} from '../lib/server/auth';
import { Q, type UserRow } from '../lib/server/db';
import {
  buildSessionCookie,
  readSessionCookie,
} from '../lib/server/session';
import { rateLimit } from '../lib/server/ratelimit';

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (user) {
    return redirect('/');
  }
  return null;
}

interface ActionResult {
  error?: string;
  values?: { email?: string };
}

export async function action({ request, context }: Route.ActionArgs): Promise<ActionResult | Response> {
  const env = context.cloudflare.env;
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const ip = request.headers.get('CF-Connecting-IP');
  const userAgent = request.headers.get('User-Agent');

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해 주세요.', values: { email } };
  }

  const rl = await rateLimit(env.KV, {
    key: `login:${ip ?? 'noip'}:${email}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    const mins = Math.ceil(rl.retryAfterSec / 60);
    return {
      error: `너무 많은 시도가 있었습니다. ${mins}분 후 다시 시도해 주세요.`,
      values: { email },
    };
  }

  const user = await env.DB
    .prepare(Q.selectUserByEmail)
    .bind(email)
    .first<UserRow>();

  // 이메일 enumeration 방어 — 동일 메시지
  const generic = '이메일 또는 비밀번호가 올바르지 않습니다.';

  if (!user || !user.password_hash) {
    await audit(env.DB, {
      user_id: null,
      action: 'login.fail',
      ip,
      user_agent: userAgent,
      metadata: JSON.stringify({ email, reason: 'no_user' }),
    });
    return { error: generic, values: { email } };
  }

  if (user.locked_until && user.locked_until > Date.now()) {
    const remainMin = Math.ceil((user.locked_until - Date.now()) / 60_000);
    return {
      error: `보안을 위해 잠시 잠겼습니다. 약 ${remainMin}분 후 다시 시도해 주세요.`,
      values: { email },
    };
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await bumpFailedLogin(env.DB, user.id);
    await audit(env.DB, {
      user_id: user.id,
      action: 'login.fail',
      ip,
      user_agent: userAgent,
      metadata: JSON.stringify({ reason: 'bad_password' }),
    });
    return { error: generic, values: { email } };
  }

  if (user.status === 'pending') {
    return {
      error: '관리자 승인 대기 중입니다. 평균 1~2 영업일 소요됩니다.',
      values: { email },
    };
  }
  if (user.status === 'suspended') {
    return { error: '계정이 정지되었습니다. 관리자에게 문의해 주세요.', values: { email } };
  }

  await resetFailedLogin(env.DB, user.id);

  const { token, expiresAt } = await createSession(env.DB, user.id, { ip, userAgent });
  await audit(env.DB, {
    user_id: user.id,
    action: 'login.success',
    ip,
    user_agent: userAgent,
  });

  const isProd = (env.PUBLIC_APP_URL ?? '').startsWith('https://');
  const cookie = buildSessionCookie(token, {
    secure: isProd,
    expires: expiresAt,
    domain: isProd ? '.lawyalty.com' : undefined,
  });

  return redirect('/', { headers: { 'Set-Cookie': cookie } });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';

  return (
    <AuthShell
      title="로그인"
      subtitle="라윌티 계정으로 시작하세요"
      footer={
        <span>
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-ink-700 font-medium hover:underline">
            가입하기
          </Link>
        </span>
      }
    >
      <Form method="post" className="space-y-4" replace>
        {actionData?.error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-300/60 bg-red-50/60 backdrop-blur-md px-3.5 py-2.5 text-[13px] text-red-700"
          >
            {actionData.error}
          </div>
        )}

        <Field
          label="이메일"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={actionData?.values?.email ?? ''}
          placeholder="name@example.com"
        />

        <Field
          label="비밀번호"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between text-[13px]">
          <label className="inline-flex items-center gap-2 text-ink-500">
            <input
              type="checkbox"
              name="remember"
              className="size-4 rounded border-silver-300 accent-ink-700"
            />
            이 기기 기억하기
          </label>
          <Link to="/auth/reset" className="text-ink-600 hover:text-ink-700 hover:underline">
            비밀번호 찾기
          </Link>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          로그인
        </Button>
      </Form>
    </AuthShell>
  );
}
