# 카카오 통합 로그인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이메일/비번 로그인과 동일 계정에 묶이는 카카오 OAuth 통합 로그인을 추가한다. 카카오 로그인 시 자동 가입(`status='active'`)되고, 동일 이메일의 기존 계정에는 자동 연동된다.

**Architecture:** Cloudflare Worker에서 Authorization Code 흐름 처리. `arctic` 라이브러리의 Kakao provider로 토큰 교환, `kapi.kakao.com/v2/user/me`로 프로필 조회. 매칭 로직은 ① `oauth_accounts` 조회 → ② 검증된 이메일로 `users` 조회 → ③ 신규 생성 순. state는 HttpOnly 쿠키로 CSRF 방어.

**Tech Stack:** React Router 7, Cloudflare Workers, D1, arctic(OAuth client), vitest + `@cloudflare/vitest-pool-workers`.

**관련 스펙:** `docs/superpowers/specs/2026-05-13-kakao-login-design.md`

---

## File Structure

신규:
- `web/app/lib/server/kakao.ts` — arctic 클라이언트 + 매칭/가입 로직 + 카카오 프로필 fetch
- `web/app/routes/auth.kakao.tsx` — `/auth/kakao` (state 발급 + 인가 URL 리다이렉트)
- `web/app/routes/auth.kakao.callback.tsx` — `/auth/kakao/callback` (토큰 교환 + 매칭 + 세션 발급)
- `web/app/components/KakaoButton.tsx` — 카카오 노란색 버튼
- `web/test/auth/kakao.test.ts` — 매칭 로직 단위 테스트
- `web/test/auth/kakao-callback.test.ts` — 콜백 라우트 통합 테스트
- `web/test/fixtures/kakao-profile.ts` — 카카오 응답 fixture

수정:
- `web/app/routes.ts` — 두 라우트 등록
- `web/app/routes/login.tsx`, `web/app/routes/signup.tsx` — 카카오 버튼 + `error` 쿼리 표시
- `web/app/lib/server/db.ts` — `OauthAccountRow` 타입, `Q.selectOauthAccount` / `Q.insertOauthAccount` / `Q.insertUserOauth` 추가
- `web/wrangler.jsonc` — 주석에 KAKAO 시크릿 키 안내
- `web/.dev.vars` — KAKAO_* 키 슬롯
- `web/package.json` — `arctic` 의존성

---

### Task 1: 의존성 + 환경변수 슬롯

**Files:**
- Modify: `web/package.json`
- Modify: `web/.dev.vars`
- Modify: `web/wrangler.jsonc`

- [ ] **Step 1: arctic 설치**

```bash
cd web && npm install arctic@^3
```

- [ ] **Step 2: `.dev.vars`에 카카오 키 슬롯 추가**

`web/.dev.vars` 끝에 추가:

```
# 카카오 OAuth (https://developers.kakao.com → 내 애플리케이션)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:5174/auth/kakao/callback
```

(실제 값은 사용자가 카카오 콘솔에서 받아 채워 넣음. 빈 문자열로 두면 dev 서버 부팅은 가능, 카카오 라우트만 실패.)

- [ ] **Step 3: `wrangler.jsonc`에 시크릿 안내 주석 추가**

`SSO_SECRET 은 secret …` 줄 바로 아래에 추가:

```jsonc
  // KAKAO_CLIENT_ID / KAKAO_CLIENT_SECRET / KAKAO_REDIRECT_URI 도 secret
  // (로컬: web/.dev.vars, prod: `wrangler secret put KAKAO_CLIENT_ID` 등)
```

- [ ] **Step 4: wrangler types 재생성**

```bash
cd web && npm run cf-typegen
```

기대: `worker-configuration.d.ts`에 `KAKAO_CLIENT_ID: string` 등이 추가됨.

- [ ] **Step 5: 커밋**

```bash
git add web/package.json web/package-lock.json web/.dev.vars web/wrangler.jsonc web/worker-configuration.d.ts
git commit -m "chore(auth): arctic + KAKAO_* env slots for 카카오 로그인"
```

---

### Task 2: DB 타입/쿼리 추가 (oauth_accounts)

**Files:**
- Modify: `web/app/lib/server/db.ts`

- [ ] **Step 1: `OauthAccountRow` 타입 추가**

`AuditLogRow` 인터페이스 다음 줄 부근에 추가:

```ts
export interface OauthAccountRow {
  provider: string;
  provider_user_id: string;
  user_id: string;
  email: string | null;
  linked_at: number;
}
```

- [ ] **Step 2: `Q` 객체에 쿼리 추가**

`Q` 객체의 `// audit` 섹션 위 (또는 `// admin` 다음) 에 추가:

```ts
  // oauth
  selectOauthAccount: `
    SELECT * FROM oauth_accounts
    WHERE provider = ? AND provider_user_id = ?
    LIMIT 1
  `,
  insertOauthAccount: `
    INSERT INTO oauth_accounts (provider, provider_user_id, user_id, email, linked_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  insertUserOauth: `
    INSERT INTO users (
      id, email, name, password_hash, role, status,
      email_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, 'user', 'active', ?, ?, ?)
  `,
```

- [ ] **Step 3: 타입체크**

```bash
cd web && npm run typecheck
```

기대: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add web/app/lib/server/db.ts
git commit -m "feat(auth): oauth_accounts 쿼리/타입 추가"
```

---

### Task 3: 카카오 프로필 fixture

**Files:**
- Create: `web/test/fixtures/kakao-profile.ts`

- [ ] **Step 1: fixture 작성**

```ts
/**
 * 카카오 /v2/user/me 응답 fixture.
 * 실제 응답 형태: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#req-user-info
 */

export interface KakaoProfile {
  id: number;
  kakao_account?: {
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
    };
  };
}

export function kakaoProfileOk(overrides: Partial<KakaoProfile> = {}): KakaoProfile {
  return {
    id: 1234567890,
    kakao_account: {
      email: 'kakao-user@example.com',
      is_email_valid: true,
      is_email_verified: true,
      profile: { nickname: '홍길동' },
    },
    ...overrides,
  };
}

export function kakaoProfileNoEmail(): KakaoProfile {
  return {
    id: 1234567890,
    kakao_account: {
      profile: { nickname: '홍길동' },
    },
  };
}

export function kakaoProfileUnverifiedEmail(): KakaoProfile {
  return {
    id: 1234567890,
    kakao_account: {
      email: 'kakao-user@example.com',
      is_email_valid: true,
      is_email_verified: false,
      profile: { nickname: '홍길동' },
    },
  };
}
```

- [ ] **Step 2: 커밋**

```bash
git add web/test/fixtures/kakao-profile.ts
git commit -m "test: 카카오 프로필 fixture"
```

---

### Task 4: 매칭 로직 — TDD (단위 테스트 작성)

**Files:**
- Create: `web/test/auth/kakao.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { env, applyD1Migrations } from 'cloudflare:test';
import { resolveKakaoUser } from '../../app/lib/server/kakao';
import { kakaoProfileOk, kakaoProfileNoEmail, kakaoProfileUnverifiedEmail } from '../fixtures/kakao-profile';

async function seedUser(row: {
  id: string; email: string; name?: string; status?: string; password_hash?: string | null;
}) {
  const now = Date.now();
  await env.DB
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, role, status,
                          mfa_enabled, failed_login_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'user', ?, 0, 0, ?, ?)`,
    )
    .bind(
      row.id,
      row.email,
      row.name ?? 'X',
      row.password_hash ?? null,
      row.status ?? 'active',
      now,
      now,
    )
    .run();
}

describe('resolveKakaoUser', () => {
  beforeEach(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    await env.DB.exec(`DELETE FROM oauth_accounts`);
    await env.DB.exec(`DELETE FROM sessions`);
    await env.DB.exec(`DELETE FROM users`);
  });

  it('① oauth_accounts 매칭 — 기존 user 재사용', async () => {
    await seedUser({ id: 'u-existing', email: 'exist@example.com' });
    await env.DB
      .prepare(
        `INSERT INTO oauth_accounts (provider, provider_user_id, user_id, email, linked_at)
         VALUES ('kakao', '1234567890', 'u-existing', 'exist@example.com', ?)`,
      )
      .bind(Date.now())
      .run();

    const result = await resolveKakaoUser(env.DB, kakaoProfileOk());
    expect(result).toEqual({ kind: 'login', userId: 'u-existing' });
  });

  it('② 동일 이메일 user 존재 — oauth 자동 연동', async () => {
    await seedUser({ id: 'u-byemail', email: 'kakao-user@example.com' });

    const result = await resolveKakaoUser(env.DB, kakaoProfileOk());
    expect(result).toEqual({ kind: 'link', userId: 'u-byemail' });

    const link = await env.DB
      .prepare(`SELECT * FROM oauth_accounts WHERE provider='kakao' AND provider_user_id='1234567890'`)
      .first<{ user_id: string }>();
    expect(link?.user_id).toBe('u-byemail');
  });

  it('②-b 동일 이메일이지만 status=pending — active로 승격', async () => {
    await seedUser({ id: 'u-pending', email: 'kakao-user@example.com', status: 'pending' });

    const result = await resolveKakaoUser(env.DB, kakaoProfileOk());
    expect(result.kind).toBe('link');

    const u = await env.DB.prepare(`SELECT status FROM users WHERE id='u-pending'`).first<{ status: string }>();
    expect(u?.status).toBe('active');
  });

  it('②-c 동일 이메일 + status=suspended — 거부', async () => {
    await seedUser({ id: 'u-susp', email: 'kakao-user@example.com', status: 'suspended' });

    const result = await resolveKakaoUser(env.DB, kakaoProfileOk());
    expect(result).toEqual({ kind: 'reject', reason: 'kakao_account_suspended' });
  });

  it('③ 신규 가입 — users + oauth_accounts INSERT, status=active', async () => {
    const result = await resolveKakaoUser(env.DB, kakaoProfileOk());
    expect(result.kind).toBe('signup');

    if (result.kind !== 'signup') return;
    const u = await env.DB.prepare(`SELECT * FROM users WHERE id=?`).bind(result.userId).first<{
      email: string; name: string; status: string; password_hash: string | null;
    }>();
    expect(u?.email).toBe('kakao-user@example.com');
    expect(u?.name).toBe('홍길동');
    expect(u?.status).toBe('active');
    expect(u?.password_hash).toBeNull();
  });

  it('이메일 동의 거부 — kakao_email_required', async () => {
    const result = await resolveKakaoUser(env.DB, kakaoProfileNoEmail());
    expect(result).toEqual({ kind: 'reject', reason: 'kakao_email_required' });
  });

  it('이메일 미검증 — kakao_email_required', async () => {
    const result = await resolveKakaoUser(env.DB, kakaoProfileUnverifiedEmail());
    expect(result).toEqual({ kind: 'reject', reason: 'kakao_email_required' });
  });
});
```

- [ ] **Step 2: 실행 — 실패 확인**

```bash
cd web && npx vitest run test/auth/kakao.test.ts
```

기대: 모두 FAIL with "Cannot find module '../../app/lib/server/kakao'".

---

### Task 5: 매칭 로직 — 구현

**Files:**
- Create: `web/app/lib/server/kakao.ts`

- [ ] **Step 1: `resolveKakaoUser` 구현**

```ts
/**
 * 카카오 OAuth 매칭/가입 로직.
 * 스펙: docs/superpowers/specs/2026-05-13-kakao-login-design.md § 5
 */

import { Kakao } from 'arctic';
import { Q, type UserRow, type OauthAccountRow } from './db';

export interface KakaoProfile {
  id: number;
  kakao_account?: {
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: { nickname?: string };
  };
}

export type ResolveResult =
  | { kind: 'login'; userId: string }
  | { kind: 'link'; userId: string }
  | { kind: 'signup'; userId: string }
  | { kind: 'reject'; reason: 'kakao_email_required' | 'kakao_account_suspended' | 'kakao_account_deleted' };

export async function resolveKakaoUser(db: D1Database, profile: KakaoProfile): Promise<ResolveResult> {
  const kakaoId = String(profile.id);
  const now = Date.now();

  // ① oauth_accounts 매칭
  const linked = await db
    .prepare(Q.selectOauthAccount)
    .bind('kakao', kakaoId)
    .first<OauthAccountRow>();
  if (linked) {
    const u = await db.prepare(Q.selectUserById).bind(linked.user_id).first<UserRow>();
    if (!u) return { kind: 'reject', reason: 'kakao_account_deleted' };
    if (u.status === 'suspended') return { kind: 'reject', reason: 'kakao_account_suspended' };
    if (u.status === 'deleted') return { kind: 'reject', reason: 'kakao_account_deleted' };
    return { kind: 'login', userId: u.id };
  }

  // 이메일 검증
  const acct = profile.kakao_account;
  const email = acct?.email?.trim().toLowerCase();
  if (!email || acct?.is_email_verified === false || acct?.is_email_valid === false) {
    return { kind: 'reject', reason: 'kakao_email_required' };
  }
  const nickname = acct?.profile?.nickname ?? '카카오 사용자';

  // ② 동일 이메일 user 매칭
  const byEmail = await db.prepare(Q.selectUserByEmail).bind(email).first<UserRow>();
  if (byEmail) {
    if (byEmail.status === 'suspended') return { kind: 'reject', reason: 'kakao_account_suspended' };
    if (byEmail.status === 'deleted') return { kind: 'reject', reason: 'kakao_account_deleted' };

    const stmts: D1PreparedStatement[] = [
      db.prepare(Q.insertOauthAccount).bind('kakao', kakaoId, byEmail.id, email, now),
    ];
    if (byEmail.status === 'pending') {
      stmts.push(db.prepare(Q.updateUserStatus).bind('active', now, byEmail.id));
    }
    await db.batch(stmts);
    return { kind: 'link', userId: byEmail.id };
  }

  // ③ 신규 가입
  const userId = crypto.randomUUID();
  await db.batch([
    db.prepare(Q.insertUserOauth).bind(userId, email, nickname, now, now, now),
    db.prepare(Q.insertOauthAccount).bind('kakao', kakaoId, userId, email, now),
  ]);
  return { kind: 'signup', userId };
}

// ── arctic 클라이언트 팩토리 ─────────────────────────

export interface KakaoEnv {
  KAKAO_CLIENT_ID: string;
  KAKAO_CLIENT_SECRET: string;
  KAKAO_REDIRECT_URI: string;
}

export function makeKakaoClient(env: KakaoEnv): Kakao {
  return new Kakao(env.KAKAO_CLIENT_ID, env.KAKAO_CLIENT_SECRET, env.KAKAO_REDIRECT_URI);
}

// ── 카카오 프로필 fetch ──────────────────────────────

export async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const res = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`kakao_profile_fetch_failed: ${res.status}`);
  return (await res.json()) as KakaoProfile;
}
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

```bash
cd web && npx vitest run test/auth/kakao.test.ts
```

기대: 7개 테스트 모두 PASS.

- [ ] **Step 3: 타입체크**

```bash
cd web && npm run typecheck
```

- [ ] **Step 4: 커밋**

```bash
git add web/app/lib/server/kakao.ts web/test/auth/kakao.test.ts web/test/fixtures/kakao-profile.ts
git commit -m "feat(auth): 카카오 매칭/가입 로직 (resolveKakaoUser)"
```

---

### Task 6: `/auth/kakao` 시작 라우트

**Files:**
- Create: `web/app/routes/auth.kakao.tsx`

- [ ] **Step 1: 구현**

```tsx
/**
 * GET /auth/kakao — state 발급 후 카카오 인가 URL로 리다이렉트.
 * 스펙: docs/superpowers/specs/2026-05-13-kakao-login-design.md § 4
 */

import { redirect } from 'react-router';
import { generateState } from 'arctic';
import type { Route } from './+types/auth.kakao';

import { makeKakaoClient } from '../lib/server/kakao';
import { audit } from '../lib/server/auth';

const STATE_COOKIE = 'kakao_oauth_state';
const STATE_TTL_SECONDS = 600; // 10분

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  if (!env.KAKAO_CLIENT_ID || !env.KAKAO_REDIRECT_URI) {
    throw new Response('Kakao OAuth not configured', { status: 500 });
  }

  const state = generateState();
  const kakao = makeKakaoClient(env);
  const url: URL = await kakao.createAuthorizationURL(state, ['account_email', 'profile_nickname']);

  const isProd = (env.PUBLIC_APP_URL ?? '').startsWith('https://');
  const cookieParts = [
    `${STATE_COOKIE}=${state}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${STATE_TTL_SECONDS}`,
  ];
  if (isProd) cookieParts.push('Secure');

  await audit(env.DB, {
    user_id: null,
    action: 'kakao.login.start',
    ip: request.headers.get('CF-Connecting-IP'),
    user_agent: request.headers.get('User-Agent'),
  });

  return redirect(url.toString(), {
    headers: { 'Set-Cookie': cookieParts.join('; ') },
  });
}
```

- [ ] **Step 2: 라우트 등록**

`web/app/routes.ts` 수정:

```ts
import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('auth/kakao', 'routes/auth.kakao.tsx'),
  route('auth/kakao/callback', 'routes/auth.kakao.callback.tsx'),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
```

(콜백 라우트 파일은 다음 Task에서 생성하므로 typegen 에러가 잠시 날 수 있음 — 다음 Task 끝에 typecheck 통과시킴.)

- [ ] **Step 3: 커밋 (콜백은 다음 Task에서)**

```bash
git add web/app/routes/auth.kakao.tsx web/app/routes.ts
git commit -m "feat(auth): /auth/kakao 시작 라우트 + state 쿠키"
```

---

### Task 7: 콜백 라우트 — TDD (통합 테스트 작성)

**Files:**
- Create: `web/test/auth/kakao-callback.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { env, applyD1Migrations } from 'cloudflare:test';
import { loader as callbackLoader } from '../../app/routes/auth.kakao.callback';
import { kakaoProfileOk, kakaoProfileNoEmail } from '../fixtures/kakao-profile';

const ROUTE_CTX = { cloudflare: { env } } as unknown as Parameters<typeof callbackLoader>[0]['context'];

function buildArgs(opts: {
  url: string;
  cookie?: string;
}): Parameters<typeof callbackLoader>[0] {
  const headers = new Headers();
  if (opts.cookie) headers.set('Cookie', opts.cookie);
  return {
    request: new Request(opts.url, { headers }),
    params: {},
    context: ROUTE_CTX,
  } as Parameters<typeof callbackLoader>[0];
}

describe('GET /auth/kakao/callback', () => {
  beforeEach(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    await env.DB.exec(`DELETE FROM oauth_accounts`);
    await env.DB.exec(`DELETE FROM sessions`);
    await env.DB.exec(`DELETE FROM users`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('state mismatch → /login?error=kakao_state_mismatch', async () => {
    const res = (await callbackLoader(
      buildArgs({
        url: 'http://x/auth/kakao/callback?code=c1&state=WRONG',
        cookie: 'kakao_oauth_state=RIGHT',
      }),
    )) as Response;

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/login?error=kakao_state_mismatch');
  });

  it('이메일 동의 거부 → /login?error=kakao_email_required', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('kauth.kakao.com/oauth/token')) {
        return new Response(JSON.stringify({ access_token: 'A', token_type: 'bearer', expires_in: 3600 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (url.includes('kapi.kakao.com/v2/user/me')) {
        return new Response(JSON.stringify(kakaoProfileNoEmail()), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const res = (await callbackLoader(
      buildArgs({
        url: 'http://x/auth/kakao/callback?code=c1&state=S1',
        cookie: 'kakao_oauth_state=S1',
      }),
    )) as Response;

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/login?error=kakao_email_required');
  });

  it('정상 신규 가입 → / 리다이렉트 + Set-Cookie 세션', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('kauth.kakao.com/oauth/token')) {
        return new Response(JSON.stringify({ access_token: 'A', token_type: 'bearer', expires_in: 3600 }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      if (url.includes('kapi.kakao.com/v2/user/me')) {
        return new Response(JSON.stringify(kakaoProfileOk()), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const res = (await callbackLoader(
      buildArgs({
        url: 'http://x/auth/kakao/callback?code=c1&state=S1',
        cookie: 'kakao_oauth_state=S1',
      }),
    )) as Response;

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/');
    const setCookie = res.headers.get('Set-Cookie') ?? '';
    expect(setCookie).toMatch(/lawyalty_session=/);

    const created = await env.DB
      .prepare(`SELECT * FROM users WHERE email='kakao-user@example.com'`)
      .first<{ status: string; password_hash: string | null }>();
    expect(created?.status).toBe('active');
    expect(created?.password_hash).toBeNull();
  });
});
```

- [ ] **Step 2: 실행 — 실패 확인**

```bash
cd web && npx vitest run test/auth/kakao-callback.test.ts
```

기대: FAIL with "Cannot find module '../../app/routes/auth.kakao.callback'".

---

### Task 8: 콜백 라우트 — 구현

**Files:**
- Create: `web/app/routes/auth.kakao.callback.tsx`

- [ ] **Step 1: 구현**

```tsx
/**
 * GET /auth/kakao/callback — code+state 검증, 토큰 교환, 매칭, 세션 발급.
 * 스펙: docs/superpowers/specs/2026-05-13-kakao-login-design.md § 4-7
 */

import { redirect } from 'react-router';
import type { Route } from './+types/auth.kakao.callback';

import { audit, createSession } from '../lib/server/auth';
import { buildSessionCookie } from '../lib/server/session';
import {
  fetchKakaoProfile,
  makeKakaoClient,
  resolveKakaoUser,
} from '../lib/server/kakao';

const STATE_COOKIE = 'kakao_oauth_state';

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const piece of header.split(';')) {
    const [k, ...rest] = piece.trim().split('=');
    if (k === name) return rest.join('=') || null;
  }
  return null;
}

function clearStateCookie(isProd: boolean): string {
  const parts = [`${STATE_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

function fail(reason: string, isProd: boolean): Response {
  const headers = new Headers({ Location: `/login?error=${reason}` });
  headers.append('Set-Cookie', clearStateCookie(isProd));
  return new Response(null, { status: 302, headers });
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const isProd = (env.PUBLIC_APP_URL ?? '').startsWith('https://');
  const ip = request.headers.get('CF-Connecting-IP');
  const userAgent = request.headers.get('User-Agent');

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = readCookie(request.headers.get('Cookie'), STATE_COOKIE);

  if (!code || !state || !cookieState || state !== cookieState) {
    await audit(env.DB, {
      user_id: null, action: 'kakao.login.fail', ip, user_agent: userAgent,
      metadata: JSON.stringify({ reason: 'state_mismatch' }),
    });
    return fail('kakao_state_mismatch', isProd);
  }

  // 토큰 교환
  let accessToken: string;
  try {
    const kakao = makeKakaoClient(env);
    const tokens = await kakao.validateAuthorizationCode(code);
    accessToken = tokens.accessToken();
  } catch (err) {
    await audit(env.DB, {
      user_id: null, action: 'kakao.login.fail', ip, user_agent: userAgent,
      metadata: JSON.stringify({ reason: 'token_failed', err: String(err) }),
    });
    return fail('kakao_token_failed', isProd);
  }

  // 프로필 조회
  let profile;
  try {
    profile = await fetchKakaoProfile(accessToken);
  } catch (err) {
    await audit(env.DB, {
      user_id: null, action: 'kakao.login.fail', ip, user_agent: userAgent,
      metadata: JSON.stringify({ reason: 'profile_failed', err: String(err) }),
    });
    return fail('kakao_token_failed', isProd);
  }

  // 매칭
  const result = await resolveKakaoUser(env.DB, profile);
  if (result.kind === 'reject') {
    await audit(env.DB, {
      user_id: null, action: 'kakao.login.fail', ip, user_agent: userAgent,
      metadata: JSON.stringify({ reason: result.reason, kakao_id: profile.id }),
    });
    return fail(result.reason, isProd);
  }

  // 세션 발급
  const { token, expiresAt } = await createSession(env.DB, result.userId, { ip, userAgent });
  await audit(env.DB, {
    user_id: result.userId,
    action:
      result.kind === 'signup' ? 'kakao.signup.success'
      : result.kind === 'link' ? 'kakao.link.success'
      : 'kakao.login.success',
    ip, user_agent: userAgent,
  });

  const sessionCookie = buildSessionCookie(token, {
    secure: isProd,
    expires: expiresAt,
    domain: isProd ? '.lawyalty.com' : undefined,
  });

  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', sessionCookie);
  headers.append('Set-Cookie', clearStateCookie(isProd));
  return new Response(null, { status: 302, headers });
}
```

- [ ] **Step 2: typegen + 테스트 실행**

```bash
cd web && npx react-router typegen && npx vitest run test/auth/kakao-callback.test.ts
```

기대: 3개 테스트 PASS.

- [ ] **Step 3: 전체 타입체크**

```bash
cd web && npm run typecheck
```

기대: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add web/app/routes/auth.kakao.callback.tsx web/test/auth/kakao-callback.test.ts
git commit -m "feat(auth): /auth/kakao/callback 토큰 교환·매칭·세션 발급"
```

---

### Task 9: KakaoButton 컴포넌트

**Files:**
- Create: `web/app/components/KakaoButton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

카카오 브랜드 가이드: 배경 `#FEE500`, 텍스트 `#000000` (87% opacity 권장 → `rgba(0,0,0,0.85)`), 카카오 심볼 SVG 좌측.

```tsx
import { Link } from 'react-router';

export function KakaoButton({ to = '/auth/kakao', label = '카카오로 시작하기' }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-medium transition active:scale-[0.99]"
      style={{ backgroundColor: '#FEE500', color: 'rgba(0,0,0,0.85)' }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9 1.5C4.86 1.5 1.5 4.13 1.5 7.38c0 2.1 1.41 3.94 3.53 4.96l-.78 2.85c-.07.27.22.49.45.34l3.42-2.27c.29.03.58.04.88.04 4.14 0 7.5-2.63 7.5-5.92S13.14 1.5 9 1.5z"
        />
      </svg>
      {label}
    </Link>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add web/app/components/KakaoButton.tsx
git commit -m "feat(ui): 카카오 노란색 버튼 컴포넌트"
```

---

### Task 10: 로그인/가입 페이지 통합 (버튼 + 에러 표시)

**Files:**
- Modify: `web/app/routes/login.tsx`
- Modify: `web/app/routes/signup.tsx`

- [ ] **Step 1: `login.tsx` — 에러 코드 → 메시지 매핑 추가**

`login.tsx` 상단 import 옆에 추가:

```tsx
import { KakaoButton } from '../components/KakaoButton';

const KAKAO_ERROR_MESSAGES: Record<string, string> = {
  kakao_state_mismatch: '인증 세션이 만료되었습니다. 다시 시도해 주세요.',
  kakao_email_required: '이메일 제공 동의가 필요합니다. 동의 후 다시 시도해 주세요.',
  kakao_account_suspended: '계정이 정지되었습니다. 관리자에게 문의해 주세요.',
  kakao_account_deleted: '사용할 수 없는 계정입니다.',
  kakao_token_failed: '카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
};
```

- [ ] **Step 2: `login.tsx` — `loader` 수정 (에러 쿼리 추출)**

기존 `loader` 교체:

```tsx
export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (user) {
    return redirect('/');
  }
  const url = new URL(request.url);
  const errorCode = url.searchParams.get('error');
  const kakaoError = errorCode ? KAKAO_ERROR_MESSAGES[errorCode] ?? null : null;
  return { kakaoError };
}
```

- [ ] **Step 3: `login.tsx` — `Login` 컴포넌트 props/렌더 수정**

`export default function Login({ actionData }: Route.ComponentProps)` 시그니처를 다음으로 교체:

```tsx
export default function Login({ actionData, loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';
  const kakaoError = loaderData?.kakaoError;
```

그리고 `<Form …>` 위(actionData?.error 알림 다음)에 카카오 에러 알림 추가:

```tsx
        {kakaoError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-300/60 bg-red-50/60 backdrop-blur-md px-3.5 py-2.5 text-[13px] text-red-700"
          >
            {kakaoError}
          </div>
        )}
```

`</Form>` 바로 다음에 카카오 버튼 블록 추가:

```tsx
      <div className="my-5 flex items-center gap-3 text-[12px] text-ink-400">
        <div className="h-px flex-1 bg-silver-200" />
        <span>또는</span>
        <div className="h-px flex-1 bg-silver-200" />
      </div>
      <KakaoButton />
```

- [ ] **Step 4: `signup.tsx`에도 같은 카카오 버튼 추가**

`signup.tsx` 상단:

```tsx
import { KakaoButton } from '../components/KakaoButton';
```

회원가입 폼 `</Form>` 직후에 (login과 동일 패턴):

```tsx
      <div className="my-5 flex items-center gap-3 text-[12px] text-ink-400">
        <div className="h-px flex-1 bg-silver-200" />
        <span>또는</span>
        <div className="h-px flex-1 bg-silver-200" />
      </div>
      <KakaoButton label="카카오로 가입하기" />
```

(signup 페이지의 에러 표시는 카카오 콜백이 항상 `/login`으로 리다이렉트하므로 추가 안 함.)

- [ ] **Step 5: 타입체크 + 빌드 스모크**

```bash
cd web && npm run typecheck
```

- [ ] **Step 6: 커밋**

```bash
git add web/app/routes/login.tsx web/app/routes/signup.tsx
git commit -m "feat(ui): 로그인/가입 페이지에 카카오 버튼 + 에러 표시"
```

---

### Task 11: 전체 테스트 + 수동 스모크

- [ ] **Step 1: 전체 테스트 실행**

```bash
cd web && npm test
```

기대: 모두 PASS (기존 5개 + 신규 카카오 매칭 7개 + 카카오 콜백 3개).

- [ ] **Step 2: 사용자에게 보고**

다음 작업이 사용자 측 카카오 콘솔 세팅을 필요로 한다고 안내:

> 카카오 디벨로퍼스 콘솔에서:
> 1. 카카오 로그인 ON
> 2. Redirect URI에 `http://localhost:5174/auth/kakao/callback` 추가
> 3. 동의항목: 닉네임(필수), 카카오계정(이메일)(필수)
> 4. Client Secret 발급 + "사용함"
> 5. REST API 키 + Client Secret을 `web/.dev.vars`의 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`에 입력

- [ ] **Step 3: 사용자 환경에서 dev 서버로 수동 확인**

```bash
cd web && npm run dev
```

수동 시나리오:
- `/login` → "카카오로 시작하기" 클릭 → 카카오 로그인 → `/`로 복귀, 세션 쿠키 발급 확인
- 다시 `/login` → 카카오 → 즉시 재로그인 (oauth_accounts 매칭 경로)
- D1에서 `SELECT * FROM users WHERE email='<카카오 이메일>'` → status='active', password_hash IS NULL 확인

(이 단계는 인간 작업이므로 플랜 자동 실행 시 사용자에게 명시적으로 넘긴다.)

---

## Self-Review Notes

- 스펙 § 4 흐름 → Task 6, 8 ✓
- 스펙 § 5 매칭 3가지 + edge cases → Task 4, 5 ✓
- 스펙 § 7 에러 코드 5종 → callback 라우트 + login 페이지 매핑 ✓
- 스펙 § 8 audit 액션 5종 → callback 라우트 ✓
- 스펙 § 9 UI → Task 9, 10 ✓
- 스펙 § 11 시크릿 → Task 1 ✓
- 스펙 § 14 테스트 → Task 4, 7 ✓
