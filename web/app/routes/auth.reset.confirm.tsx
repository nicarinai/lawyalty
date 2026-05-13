import { Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/auth.reset.confirm';
import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { consumeToken } from '../lib/server/tokens';
import { hashPassword, audit } from '../lib/server/auth';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) throw redirect('/auth/reset');
  return { token };
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const form = await request.formData();
  const token = String(form.get('token') ?? '');
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');

  if (password.length < 10) return { error: '비밀번호는 10자 이상이어야 합니다.' };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (kinds < 2) return { error: '영문·숫자·특수문자 중 2종류 이상을 사용해 주세요.' };
  if (password !== confirm) return { error: '비밀번호 확인이 일치하지 않습니다.' };

  const result = await consumeToken(env.DB, token, 'pw_reset');
  if (result.error) {
    return { error: '재설정 링크가 만료되었거나 이미 사용되었습니다.' };
  }

  const hash = await hashPassword(password);
  const now = Date.now();
  await env.DB
    .prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
    .bind(hash, now, result.userId)
    .run();
  await env.DB
    .prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(now, result.userId)
    .run();
  await audit(env.DB, { user_id: result.userId, action: 'pw_reset.confirm' });

  return redirect('/login?reset=1');
}

export default function ResetConfirm({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';
  return (
    <AuthShell title="새 비밀번호">
      <Form method="post" className="space-y-4" replace>
        <input type="hidden" name="token" value={loaderData.token} />
        {actionData?.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-300/60 bg-red-50/60 backdrop-blur-md px-3.5 py-2.5 text-[13px] text-red-700"
          >
            {actionData.error}
          </div>
        )}
        <Field
          label="새 비밀번호"
          type="password"
          name="password"
          required
          autoComplete="new-password"
          hint="10자 이상, 영문·숫자·특수문자 중 2종류 이상"
        />
        <Field
          label="확인"
          type="password"
          name="confirm"
          required
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          비밀번호 재설정
        </Button>
      </Form>
    </AuthShell>
  );
}
