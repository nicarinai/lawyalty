import { Form, Link, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/signup';

import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import {
  audit,
  getSessionUser,
  hashPassword,
} from '../lib/server/auth';
import { Q, type UserRole, type UserRow } from '../lib/server/db';
import { readSessionCookie } from '../lib/server/session';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'lawyer', label: '변호사 · 법무사' },
  { value: 'broker', label: '공인중개사' },
  { value: 'architect', label: '건축사' },
  { value: 'user', label: '일반 (건축주 등)' },
];

const VALID_ROLES = new Set<UserRole>(['lawyer', 'broker', 'architect', 'user']);

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (user) return redirect('/');
  return null;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  terms?: string;
  general?: string;
}

interface ActionResult {
  errors?: FieldErrors;
  values?: {
    name?: string;
    email?: string;
    role?: string;
    organization?: string;
    license_number?: string;
  };
}

export async function action({ request, context }: Route.ActionArgs): Promise<ActionResult | Response> {
  const env = context.cloudflare.env;
  const form = await request.formData();

  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const role = String(form.get('role') ?? '') as UserRole;
  const organization = String(form.get('organization') ?? '').trim() || null;
  const license_number = String(form.get('license_number') ?? '').trim() || null;
  const termsAgreed = form.get('terms') === 'on';

  const ip = request.headers.get('CF-Connecting-IP');
  const userAgent = request.headers.get('User-Agent');

  const errors: FieldErrors = {};
  const values = { name, email, role, organization: organization ?? '', license_number: license_number ?? '' };

  if (!name || name.length < 2 || name.length > 30) {
    errors.name = '이름은 2자 이상 30자 이하로 입력해 주세요.';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '이메일 형식이 올바르지 않습니다.';
  }
  if (!password || password.length < 10) {
    errors.password = '비밀번호는 10자 이상이어야 합니다.';
  } else {
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
    if (kinds < 2) {
      errors.password = '영문·숫자·특수문자 중 2종류 이상을 사용해 주세요.';
    }
  }
  if (!VALID_ROLES.has(role)) {
    errors.role = '직무를 선택해 주세요.';
  }
  if (!termsAgreed) {
    errors.terms = '약관 동의가 필요합니다.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  // 이메일 중복 체크
  const existing = await env.DB.prepare(Q.selectUserByEmail).bind(email).first<UserRow>();
  if (existing) {
    return { errors: { email: '이미 가입된 이메일입니다.' }, values };
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    if (msg === 'weak_password') {
      return { errors: { password: '비밀번호가 너무 약합니다.' }, values };
    }
    console.error('[signup] hashPassword failed:', err);
    return {
      errors: { general: `해시 처리 중 오류 (${msg})` },
      values,
    };
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB
    .prepare(Q.insertUser)
    .bind(id, email, name, passwordHash, role, 'pending', organization, license_number, now, now)
    .run();

  await audit(env.DB, {
    user_id: id,
    action: 'signup',
    ip,
    user_agent: userAgent,
    metadata: JSON.stringify({ role }),
  });

  // TODO Phase 1.5: 인증 메일 발송 → /auth/verify-email 안내
  return redirect('/auth/pending');
}

export default function Signup({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';
  const e = actionData?.errors ?? {};
  const v = actionData?.values ?? {};

  return (
    <AuthShell
      title="회원가입"
      subtitle="가입 후 관리자 승인을 거쳐 시작합니다"
      footer={
        <span>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-ink-700 font-medium hover:underline">
            로그인
          </Link>
        </span>
      }
    >
      <Form method="post" className="space-y-5" replace>
        {e.general && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-300/60 bg-red-50/60 backdrop-blur-md px-3.5 py-2.5 text-[13px] text-red-700"
          >
            {e.general}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-widest text-ink-400 uppercase">
            기본 정보
          </p>
          <Field
            label="이름"
            name="name"
            autoComplete="name"
            required
            defaultValue={v.name}
            error={e.name}
            placeholder="홍길동"
          />
          <Field
            label="이메일"
            type="email"
            name="email"
            autoComplete="email"
            required
            defaultValue={v.email}
            error={e.email}
            hint="업무용 이메일 사용을 권장합니다"
            placeholder="name@example.com"
          />
          <Field
            label="비밀번호"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            error={e.password}
            hint="10자 이상, 영문·숫자·특수문자 중 2종류 이상"
          />
        </div>

        {/* 직무 정보 */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-widest text-ink-400 uppercase">
            직무 정보
          </p>
          <div className="space-y-1.5">
            <label htmlFor="f-role" className="text-[13px] font-medium text-ink-600">
              직무
            </label>
            <select
              id="f-role"
              name="role"
              defaultValue={v.role ?? ''}
              required
              className="liquid-glass-subtle w-full h-11 px-3.5 rounded-lg text-[15px] text-ink-700 focus:outline-none focus:bg-white/85"
            >
              <option value="">선택하세요</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {e.role && (
              <p role="alert" className="text-[12px] text-red-600">{e.role}</p>
            )}
          </div>
          <Field
            label="자격 등록번호 (선택)"
            name="license_number"
            defaultValue={v.license_number}
            hint="변호사·중개사·건축사는 입력 시 빠른 승인"
            placeholder="등록번호"
          />
          <Field
            label="소속 (선택)"
            name="organization"
            defaultValue={v.organization}
            placeholder="사무소·회사명"
          />
        </div>

        {/* 동의 */}
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-[13px] text-ink-600">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-0.5 size-4 rounded border-silver-300 accent-ink-700"
            />
            <span>
              만 14세 이상이며,{' '}
              <Link to="/legal/terms" className="text-ink-700 underline">이용약관</Link>과{' '}
              <Link to="/legal/privacy" className="text-ink-700 underline">개인정보처리방침</Link>에
              동의합니다 *
            </span>
          </label>
          {e.terms && (
            <p role="alert" className="text-[12px] text-red-600">{e.terms}</p>
          )}
          <label className="flex items-start gap-2 text-[13px] text-ink-500">
            <input
              type="checkbox"
              name="marketing"
              className="mt-0.5 size-4 rounded border-silver-300 accent-ink-700"
            />
            <span>마케팅 정보 수신에 동의합니다 (선택)</span>
          </label>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          가입 신청
        </Button>
      </Form>
    </AuthShell>
  );
}
