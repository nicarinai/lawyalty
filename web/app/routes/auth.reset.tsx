import { Form, Link, useNavigation } from 'react-router';
import type { Route } from './+types/auth.reset';
import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { Q, type UserRow } from '../lib/server/db';
import { issueToken } from '../lib/server/tokens';
import { makeEmailSender } from '../lib/server/email';
import { audit } from '../lib/server/auth';

export async function action({ request, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!email) return { ok: true };

  const user = await env.DB.prepare(Q.selectUserByEmail).bind(email).first<UserRow>();
  if (user && user.status !== 'suspended' && user.status !== 'deleted') {
    const raw = await issueToken(env.DB, {
      userId: user.id,
      purpose: 'pw_reset',
      ttlMs: 30 * 60 * 1000,
    });
    const link = `${env.PUBLIC_APP_URL}/auth/reset/confirm?token=${raw}`;
    await makeEmailSender(env).send({
      to: email,
      subject: '[라윌티] 비밀번호 재설정',
      text: `30분 내에 아래 링크로 비밀번호를 재설정하세요.\n${link}`,
    });
    await audit(env.DB, { user_id: user.id, action: 'pw_reset.request' });
  }
  return { ok: true };
}

export default function Reset({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';

  if (actionData?.ok) {
    return (
      <AuthShell title="메일을 확인해 주세요">
        <p className="text-[14px] text-ink-600">
          입력하신 이메일이 가입돼 있다면, 30분 내 만료되는 재설정 링크를 보내드렸습니다.
        </p>
        <p className="mt-4 text-[13px]">
          <Link to="/login" className="underline text-ink-700">로그인으로</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="비밀번호 찾기" subtitle="가입한 이메일을 입력해 주세요">
      <Form method="post" className="space-y-4" replace>
        <Field label="이메일" type="email" name="email" required autoComplete="email" />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          재설정 링크 보내기
        </Button>
      </Form>
    </AuthShell>
  );
}
