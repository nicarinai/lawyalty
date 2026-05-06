# 라윌티 인증 게이트웨이 + open-webui 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cloudflare Worker 를 게이트웨이로 동작시켜 라윌티 자체 인증(D1) 으로 로그인한 사용자를 open-webui (홈서버 Docker) 로 SSO 헤더 + HMAC 서명으로 프록시. 동시에 가입 후 흐름(pending → 관리자 승인 → 활성화), 비밀번호 리셋, 이메일 인증, 권한별 라우트 가드, KV 레이트리밋을 완성.

**Architecture:**
- 사용자 → Cloudflare Worker (게이트웨이) → (a) 인증 라우트는 React Router 가 직접 처리, (b) 그 외는 D1 세션 검증 후 `X-Forwarded-Email/User/Groups` + HMAC 서명 헤더 주입해 open-webui 로 fetch 프록시.
- open-webui 는 `WEBUI_AUTH_TRUSTED_EMAIL_HEADER` 모드 (자체 가입/로그인 폼 비활성). Postgres 16 백엔드. HMAC 검증은 Phase 2.5 (이번 plan 마지막 task) 에서 fastapi 미들웨어로 추가 (open-webui fork 수정).
- 로컬 dev: Docker(OrbStack) 로 postgres + open-webui 띄우고, wrangler dev 의 Worker 가 호스트 `http://localhost:8080/open-webui` 로 프록시.

**Tech Stack:**
- Frontend / Worker: React Router 7, Cloudflare Workers, TypeScript, Tailwind v4
- DB: Cloudflare D1 (auth source of truth), Postgres 16 (open-webui 데이터)
- Auth: argon2id (`@noble/hashes`), opaque session token (sha256 hash 저장)
- Backend: open-webui (FastAPI) — Docker 이미지 `ghcr.io/open-webui/open-webui:main`
- Test: vitest + @cloudflare/vitest-pool-workers (Worker 환경 시뮬레이션)

---

## File Structure (created/modified)

**신규**
- `infra/docker-compose.yml` — postgres + open-webui
- `infra/.env.example` — POSTGRES_*, OPENAI_API_KEY, SSO_SECRET 템플릿
- `infra/openwebui/sso_signature.py` — open-webui fork 용 HMAC verify middleware (Phase 2.5)
- `infra/README.md` — 띄우는 법
- `web/app/lib/server/proxy.ts` — Worker → open-webui fetch 프록시 + 헤더 주입
- `web/app/lib/server/hmac.ts` — HMAC-SHA256 (헤더 서명)
- `web/app/lib/server/ratelimit.ts` — KV 레이트리밋 (5/15min, 3/h 등)
- `web/app/lib/server/tokens.ts` — one_time_tokens (이메일 인증, 비밀번호 리셋 발급/검증)
- `web/app/lib/server/email.ts` — 메일 발송 인터페이스 (dev: console.log, prod: Resend/SES)
- `web/app/routes/auth.pending.tsx` — 승인 대기 페이지
- `web/app/routes/auth.reset.tsx` — 비밀번호 리셋 요청
- `web/app/routes/auth.reset.confirm.tsx` — 토큰으로 비밀번호 재설정
- `web/app/routes/auth.verify.tsx` — 이메일 인증 (URL 클릭)
- `web/app/routes/auth.me.tsx` — 본인 정보 (loader/action)
- `web/app/routes/admin._index.tsx` — admin 진입 (사용자 목록)
- `web/app/routes/admin.users.$id.tsx` — 승인/정지/role 변경
- `web/app/routes/$.tsx` — splat 라우트, 인증 라우트가 아닌 모든 경로 → proxy
- `web/vitest.config.ts`
- `web/test/auth/hmac.test.ts`
- `web/test/auth/proxy.test.ts`
- `web/test/auth/ratelimit.test.ts`
- `web/test/auth/tokens.test.ts`
- `web/migrations/0002_indexes.sql` — `idx_tokens_user_purpose`, `idx_users_email_lower` 등

**수정**
- `web/app/routes.ts` — pending/reset/verify/me/admin/splat 라우트 추가
- `web/app/lib/server/db.ts` — Q (one_time_tokens, admin queries) 추가
- `web/app/routes/login.tsx` — KV 레이트리밋 적용, role 별 분기
- `web/app/routes/signup.tsx` — KV 레이트리밋, 인증 메일 발송 호출
- `web/app/routes/_index.tsx` — 단순 redirect 가 아니라 proxy 로 변경 (splat 이 처리하지만 `/` 도 cover)
- `web/workers/app.ts` — 그대로 (게이트웨이 라우팅은 React Router routes 가 담당)
- `web/wrangler.jsonc` — `vars.UPSTREAM_URL` (dev: `http://localhost:8080`), `secrets` 안내 주석, KV namespace ID 실제 값
- `web/package.json` — `vitest`, `@cloudflare/vitest-pool-workers` devDependency 추가, `test` script
- `web/.dev.vars` (gitignored) — `SSO_SECRET`, `UPSTREAM_URL` 추가
- `docs/lawyalty/01-auth.md` — Phase 2 완료 표시, dev 셋업 절차 보강

---

## Pre-flight: 의존성 / 환경

### Task 0: vitest + workers pool 셋업

**Files:**
- Create: `web/vitest.config.ts`
- Modify: `web/package.json`
- Create: `web/test/sanity.test.ts`

- [ ] **Step 1: 의존성 추가**

```bash
cd web && npm install -D vitest @cloudflare/vitest-pool-workers @vitest/ui
```

- [ ] **Step 2: vitest.config.ts 작성**

```ts
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          compatibilityFlags: ['nodejs_compat'],
        },
      },
    },
  },
});
```

- [ ] **Step 3: package.json 에 test 스크립트 추가**

`"test": "vitest run"` 와 `"test:watch": "vitest"` 를 scripts 에 추가.

- [ ] **Step 4: sanity test 작성 (인프라 동작 확인)**

```ts
// web/test/sanity.test.ts
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

describe('vitest workers pool', () => {
  it('exposes env.DB binding', () => {
    expect(env.DB).toBeDefined();
  });
});
```

- [ ] **Step 5: 실행 확인**

Run: `cd web && npm test`
Expected: `1 passed`

- [ ] **Step 6: 커밋**

```bash
git add web/package.json web/package-lock.json web/vitest.config.ts web/test/sanity.test.ts
git commit -m "test: vitest + cloudflare workers pool 셋업"
```

---

## Milestone 1: 인프라 (open-webui + postgres docker)

### Task 1.1: docker-compose 작성

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `infra/.env.example`
- Create: `infra/README.md`

- [ ] **Step 1: `.env.example` 작성**

```bash
# infra/.env.example
# 복사해서 infra/.env 로 두고 값 채우기 (gitignored).

# Postgres
POSTGRES_USER=openwebui
POSTGRES_PASSWORD=change_me_dev_only
POSTGRES_DB=openwebui

# open-webui 설정
WEBUI_SECRET_KEY=<openssl rand -hex 32>
SSO_SECRET=<openssl rand -hex 32>   # Worker 와 공유. wrangler .dev.vars 에 동일 값.

# LLM 키 (없으면 채팅 호출 시점에만 실패. dev 진입 자체는 가능)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# 외부 API (선택)
LAW_API_KEY=
```

- [ ] **Step 2: `docker-compose.yml` 작성**

```yaml
# infra/docker-compose.yml
services:
  postgres:
    image: postgres:16
    container_name: lawyalty-pg
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"   # 호스트 5433 (5432 충돌 방지)
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: lawyalty-webui
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      WEBUI_SECRET_KEY: ${WEBUI_SECRET_KEY}
      # 헤더 SSO 모드
      WEBUI_AUTH_TRUSTED_EMAIL_HEADER: X-Forwarded-Email
      WEBUI_AUTH_TRUSTED_NAME_HEADER:  X-Forwarded-User
      WEBUI_AUTH_TRUSTED_GROUPS_HEADER: X-Forwarded-Groups
      ENABLE_SIGNUP: "false"
      ENABLE_LOGIN_FORM: "false"
      # LLM
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      # HMAC 검증 미들웨어가 읽을 시크릿 (Task 6 에서 추가)
      SSO_SECRET: ${SSO_SECRET}
    volumes:
      - webui_data:/app/backend/data
    ports:
      - "8080:8080"   # Worker 가 dev 에서 이 주소로 프록시

volumes:
  pg_data:
  webui_data:
```

- [ ] **Step 3: `infra/README.md` 작성**

```markdown
# 라윌티 인프라 (로컬 dev)

## 처음 한 번
1. `cp .env.example .env` 후 값 채우기 (특히 `WEBUI_SECRET_KEY`, `SSO_SECRET`).
2. 동일한 `SSO_SECRET` 을 `web/.dev.vars` 에도 넣어야 함.

## 띄우기
`docker compose up -d`

## 종료
`docker compose down`  (데이터 보존)
`docker compose down -v`  (볼륨까지 삭제 — 초기화)

## 접속
- open-webui: http://localhost:8080  (직접 접속은 dev 에서만. 운영은 게이트웨이 통해서만)
- postgres: localhost:5433 (호스트), 컨테이너 내부 5432
```

- [ ] **Step 4: 띄워서 실제 동작 확인**

Run: `cd infra && cp .env.example .env && # 사용자가 값 채움 후` `docker compose up -d`
Run: `docker compose ps`
Expected: 두 컨테이너 모두 `running`, postgres `healthy`.
Run: `curl -I http://localhost:8080`
Expected: HTTP 200 또는 302 (open-webui 응답)

- [ ] **Step 5: 커밋**

```bash
git add infra/
echo "infra/.env" >> .gitignore  # 만약 root .gitignore 가 cover 안 하면
git commit -m "infra: docker-compose for postgres + open-webui (header SSO mode)"
```

---

## Milestone 2: 게이트웨이 프록시 (Worker → open-webui)

### Task 2.1: HMAC 유틸 + 테스트

**Files:**
- Create: `web/app/lib/server/hmac.ts`
- Create: `web/test/auth/hmac.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// web/test/auth/hmac.test.ts
import { describe, it, expect } from 'vitest';
import { signSso, verifySso } from '../../app/lib/server/hmac';

const SECRET = 'test-secret-32-bytes-xxxxxxxxxxxxxxxx';

describe('signSso / verifySso', () => {
  it('서명/검증 라운드트립', async () => {
    const payload = { email: 'a@b.com', name: 'A', role: 'lawyer', ts: 1700000000000 };
    const sig = await signSso(SECRET, payload);
    expect(await verifySso(SECRET, payload, sig)).toBe(true);
  });

  it('payload 변조 시 거부', async () => {
    const payload = { email: 'a@b.com', name: 'A', role: 'lawyer', ts: 1700000000000 };
    const sig = await signSso(SECRET, payload);
    const tampered = { ...payload, role: 'admin' };
    expect(await verifySso(SECRET, tampered, sig)).toBe(false);
  });

  it('상수시간 비교 (길이 다른 sig 도 false)', async () => {
    const payload = { email: 'a@b.com', name: 'A', role: 'user', ts: 1700000000000 };
    expect(await verifySso(SECRET, payload, 'short')).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd web && npm test -- hmac`
Expected: FAIL — `signSso` 가 정의되지 않음.

- [ ] **Step 3: 구현**

```ts
// web/app/lib/server/hmac.ts
export interface SsoPayload {
  email: string;
  name: string;
  role: string;
  ts: number;  // unix ms
}

const enc = new TextEncoder();

function canonical(p: SsoPayload): string {
  return `${p.email}|${p.name}|${p.role}|${p.ts}`;
}

export async function signSso(secret: string, p: SsoPayload): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(canonical(p)));
  return bytesToHex(new Uint8Array(mac));
}

export async function verifySso(secret: string, p: SsoPayload, sig: string): Promise<boolean> {
  const expected = await signSso(secret, p);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 4: 통과 확인 + 커밋**

Run: `cd web && npm test -- hmac`
Expected: 3 passed

```bash
git add web/app/lib/server/hmac.ts web/test/auth/hmac.test.ts
git commit -m "feat(auth): HMAC SSO signature util"
```

---

### Task 2.2: 게이트웨이 프록시 함수 + 테스트

**Files:**
- Create: `web/app/lib/server/proxy.ts`
- Create: `web/test/auth/proxy.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// web/test/auth/proxy.test.ts
import { describe, it, expect, vi } from 'vitest';
import { proxyToWebui } from '../../app/lib/server/proxy.ts';
import type { UserRow } from '../../app/lib/server/db';

const user: UserRow = {
  id: 'u1', email: 'a@b.com', name: 'A',
  password_hash: null, role: 'lawyer', status: 'active',
  organization: null, license_number: null,
  email_verified_at: null, phone: null, phone_verified_at: null,
  mfa_enabled: 0, mfa_secret: null,
  failed_login_count: 0, locked_until: null,
  created_at: 0, updated_at: 0, last_login_at: null,
};

describe('proxyToWebui', () => {
  it('업스트림에 X-Forwarded-* 헤더와 서명 주입', async () => {
    const captured: { url: string; headers: Headers } = { url: '', headers: new Headers() };
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      captured.url = url;
      captured.headers = new Headers(init.headers);
      return new Response('ok', { status: 200 });
    });

    const req = new Request('https://lawyalty.com/api/chats?x=1', {
      method: 'GET',
      headers: { Cookie: 'lawyalty_session=secret' },
    });

    const res = await proxyToWebui(req, user, {
      upstreamUrl: 'http://localhost:8080',
      ssoSecret: 'test-secret',
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(res.status).toBe(200);
    expect(captured.url).toBe('http://localhost:8080/api/chats?x=1');
    expect(captured.headers.get('X-Forwarded-Email')).toBe('a@b.com');
    expect(captured.headers.get('X-Forwarded-User')).toBe('A');
    expect(captured.headers.get('X-Forwarded-Groups')).toBe('lawyer');
    expect(captured.headers.get('X-Forwarded-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(captured.headers.get('X-Forwarded-Timestamp')).toMatch(/^\d+$/);
    expect(captured.headers.get('Cookie')).toBeNull();  // 쿠키 제거
  });

  it('pending 상태 사용자는 403', async () => {
    const pending = { ...user, status: 'pending' as const };
    const fetchMock = vi.fn();
    const req = new Request('https://lawyalty.com/api/chats');
    const res = await proxyToWebui(req, pending, {
      upstreamUrl: 'http://localhost:8080',
      ssoSecret: 's',
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd web && npm test -- proxy`
Expected: FAIL — `proxyToWebui` not defined.

- [ ] **Step 3: 구현**

```ts
// web/app/lib/server/proxy.ts
import { signSso } from './hmac';
import type { UserRow } from './db';

export interface ProxyOptions {
  upstreamUrl: string;
  ssoSecret: string;
  fetchImpl?: typeof fetch;
}

export async function proxyToWebui(
  request: Request,
  user: UserRow,
  opts: ProxyOptions
): Promise<Response> {
  if (user.status !== 'active') {
    return new Response('Forbidden: account not active', { status: 403 });
  }

  const url = new URL(request.url);
  const target = `${opts.upstreamUrl}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('Cookie');         // 백엔드에 세션 쿠키 노출 금지
  headers.delete('Host');           // 업스트림이 자체 Host 결정

  const ts = Date.now();
  const payload = { email: user.email, name: user.name, role: user.role, ts };
  const sig = await signSso(opts.ssoSecret, payload);

  headers.set('X-Forwarded-Email', user.email);
  headers.set('X-Forwarded-User', user.name);
  headers.set('X-Forwarded-Groups', user.role);
  headers.set('X-Forwarded-Signature', sig);
  headers.set('X-Forwarded-Timestamp', String(ts));

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  };

  const f = opts.fetchImpl ?? fetch;
  return f(target, init);
}
```

- [ ] **Step 4: 통과 확인 + 커밋**

Run: `cd web && npm test -- proxy`
Expected: 2 passed

```bash
git add web/app/lib/server/proxy.ts web/test/auth/proxy.test.ts
git commit -m "feat(gateway): SSO header injection proxy to open-webui"
```

---

### Task 2.3: splat 라우트로 실제 게이트웨이 결선

**Files:**
- Create: `web/app/routes/$.tsx`
- Modify: `web/app/routes.ts`
- Modify: `web/app/routes/_index.tsx`
- Modify: `web/wrangler.jsonc`
- Modify: `web/.dev.vars`

- [ ] **Step 1: `routes.ts` 에 splat 추가**

`web/app/routes.ts`:

```ts
import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('auth/pending', 'routes/auth.pending.tsx'),
  route('auth/reset', 'routes/auth.reset.tsx'),
  route('auth/reset/confirm', 'routes/auth.reset.confirm.tsx'),
  route('auth/verify', 'routes/auth.verify.tsx'),
  route('auth/me', 'routes/auth.me.tsx'),
  route('admin', 'routes/admin._index.tsx'),
  route('admin/users/:id', 'routes/admin.users.$id.tsx'),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
```

- [ ] **Step 2: splat 라우트 작성**

`web/app/routes/$.tsx`:

```tsx
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

async function handle(request: Request, context: Route.LoaderArgs['context']): Promise<Response> {
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

// splat 은 UI 가 없음 (전부 프록시). React Router 가 default export 를 요구하므로 빈 컴포넌트.
export default function Splat() {
  return null;
}
```

- [ ] **Step 3: `_index.tsx` 도 동일 게이트로 통합 (loader 에서 user 로그인 시 proxy)**

```tsx
// web/app/routes/_index.tsx — loader 만 교체
import { redirect } from 'react-router';
import type { Route } from './+types/_index';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';
import { proxyToWebui } from '../lib/server/proxy';

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(env.DB, token);
  if (!user) return redirect('/login');
  if (user.status === 'pending') return redirect('/auth/pending');
  return proxyToWebui(request, user, {
    upstreamUrl: env.UPSTREAM_URL,
    ssoSecret: env.SSO_SECRET,
  });
}

export default function Index() { return null; }
```

- [ ] **Step 4: `wrangler.jsonc` 의 `vars` 에 `UPSTREAM_URL` 추가, `SSO_SECRET` 은 secret 으로 분리**

```jsonc
"vars": {
  "PUBLIC_APP_URL": "http://localhost:5173",
  "WEBUI_BASE_URL": "http://localhost:5173",     // 같은 도메인 (게이트웨이)
  "UPSTREAM_URL": "http://localhost:8080"
}
// SSO_SECRET 은 .dev.vars (로컬) / `wrangler secret put SSO_SECRET` (prod)
```

- [ ] **Step 5: `.dev.vars` 업데이트**

```
PUBLIC_APP_URL=http://localhost:5173
WEBUI_BASE_URL=http://localhost:5173
UPSTREAM_URL=http://localhost:8080
SSO_SECRET=<infra/.env 의 SSO_SECRET 과 동일 값>
```

- [ ] **Step 6: `worker-configuration.d.ts` 갱신**

Run: `cd web && npx wrangler types`
Expected: `Env` 타입에 `UPSTREAM_URL`, `SSO_SECRET` 추가됨.

- [ ] **Step 7: dev 서버 재기동 후 수동 검증**

Run: `cd web && npm run dev` (background)
Run: 브라우저로 http://localhost:5173 접속.
Expected: 미로그인 상태 → `/login` 으로 redirect. 로그인 후 → open-webui 화면이 같은 도메인 (5173) 에서 렌더링.

- [ ] **Step 8: 커밋**

```bash
git add web/app/routes.ts web/app/routes/\$.tsx web/app/routes/_index.tsx web/wrangler.jsonc web/worker-configuration.d.ts
git commit -m "feat(gateway): splat route proxies authenticated traffic to open-webui"
```

---

## Milestone 3: 인증 보조 페이지 (pending / 비밀번호 리셋 / 이메일 인증)

### Task 3.1: one_time_tokens 유틸 + 테스트

**Files:**
- Create: `web/app/lib/server/tokens.ts`
- Create: `web/test/auth/tokens.test.ts`
- Modify: `web/app/lib/server/db.ts`

- [ ] **Step 1: db.ts 의 `Q` 에 토큰 쿼리 추가**

`Q.insertOneTimeToken`, `Q.consumeOneTimeToken`, `Q.selectOneTimeTokenByHash`. 인터페이스 `OneTimeTokenRow` 도 export.

```ts
// 추가할 SQL
insertOneTimeToken: `INSERT INTO one_time_tokens (token_hash, user_id, purpose, expires_at, created_at)
                    VALUES (?, ?, ?, ?, ?)`,
selectOneTimeTokenByHash: `SELECT * FROM one_time_tokens WHERE token_hash = ?`,
consumeOneTimeToken: `UPDATE one_time_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL`,
```

- [ ] **Step 2: 실패 테스트**

```ts
// web/test/auth/tokens.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { issueToken, consumeToken } from '../../app/lib/server/tokens';

describe('one-time tokens', () => {
  beforeEach(async () => {
    // 마이그레이션 적용된 빈 DB 가정. 사용자 시드.
    await env.DB.exec(`DELETE FROM one_time_tokens; DELETE FROM users;`);
    await env.DB.prepare(`INSERT INTO users (id,email,name,role,status,created_at,updated_at)
                          VALUES ('u1','a@b.com','A','user','pending',1,1)`).run();
  });

  it('발급 → 검증 → 1회 소비 → 재사용 차단', async () => {
    const raw = await issueToken(env.DB, { userId: 'u1', purpose: 'pw_reset', ttlMs: 60000 });
    const r1 = await consumeToken(env.DB, raw, 'pw_reset');
    expect(r1.userId).toBe('u1');
    const r2 = await consumeToken(env.DB, raw, 'pw_reset');
    expect(r2.error).toBe('already_used');
  });

  it('만료 토큰 거부', async () => {
    const raw = await issueToken(env.DB, { userId: 'u1', purpose: 'email_verify', ttlMs: -1 });
    const r = await consumeToken(env.DB, raw, 'email_verify');
    expect(r.error).toBe('expired');
  });

  it('purpose 불일치 거부', async () => {
    const raw = await issueToken(env.DB, { userId: 'u1', purpose: 'pw_reset', ttlMs: 60000 });
    const r = await consumeToken(env.DB, raw, 'email_verify');
    expect(r.error).toBe('purpose_mismatch');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `cd web && npm test -- tokens`
Expected: FAIL — `issueToken` not defined.

- [ ] **Step 4: 구현**

```ts
// web/app/lib/server/tokens.ts
import { Q, type OneTimeTokenRow } from './db';
import { hashToken } from './auth';

export type TokenPurpose = 'email_verify' | 'pw_reset' | 'magic_link';

export async function issueToken(
  db: D1Database,
  { userId, purpose, ttlMs }: { userId: string; purpose: TokenPurpose; ttlMs: number }
): Promise<string> {
  const raw = bytesToB64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await hashToken(raw);
  const now = Date.now();
  await db.prepare(Q.insertOneTimeToken)
    .bind(hash, userId, purpose, now + ttlMs, now)
    .run();
  return raw;
}

export async function consumeToken(
  db: D1Database, raw: string, expectedPurpose: TokenPurpose
): Promise<{ userId: string; error?: undefined } | { userId?: undefined; error: string }> {
  const hash = await hashToken(raw);
  const row = await db.prepare(Q.selectOneTimeTokenByHash).bind(hash).first<OneTimeTokenRow>();
  if (!row) return { error: 'not_found' };
  if (row.used_at) return { error: 'already_used' };
  if (row.expires_at < Date.now()) return { error: 'expired' };
  if (row.purpose !== expectedPurpose) return { error: 'purpose_mismatch' };
  await db.prepare(Q.consumeOneTimeToken).bind(Date.now(), hash).run();
  return { userId: row.user_id };
}

function bytesToB64Url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

- [ ] **Step 5: 통과 확인 + 커밋**

```bash
cd web && npm test -- tokens
git add web/app/lib/server/db.ts web/app/lib/server/tokens.ts web/test/auth/tokens.test.ts
git commit -m "feat(auth): one-time token issue/consume util"
```

---

### Task 3.2: 메일 발송 인터페이스 (dev: console)

**Files:**
- Create: `web/app/lib/server/email.ts`

- [ ] **Step 1: 작성**

```ts
// web/app/lib/server/email.ts
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(msg: EmailMessage): Promise<void>;
}

export class ConsoleEmailSender implements EmailSender {
  async send(msg: EmailMessage): Promise<void> {
    console.log('[email]', JSON.stringify({ to: msg.to, subject: msg.subject, text: msg.text }, null, 2));
  }
}

export function makeEmailSender(env: { RESEND_API_KEY?: string }): EmailSender {
  // TODO Phase 1.5: Resend / SES 연동
  return new ConsoleEmailSender();
}
```

- [ ] **Step 2: 커밋**

```bash
git add web/app/lib/server/email.ts
git commit -m "feat(auth): email sender interface (dev: console)"
```

---

### Task 3.3: `/auth/pending` 페이지

**Files:**
- Create: `web/app/routes/auth.pending.tsx`

- [ ] **Step 1: 작성**

```tsx
// web/app/routes/auth.pending.tsx
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
        {loaderData.email && <>가입 이메일 <b>{loaderData.email}</b> 로 </>}
        관리자 승인이 완료되면 로그인할 수 있습니다. 평균 1~2 영업일 소요됩니다.
      </p>
      <p className="mt-4 text-[13px] text-ink-500">
        <Link to="/logout" className="underline">로그아웃</Link>
      </p>
    </AuthShell>
  );
}
```

- [ ] **Step 2: 동작 확인**

Run: `cd web && npm run dev`
Expected: 새 가입 후 `/auth/pending` 도달, 안내 표시.

- [ ] **Step 3: 커밋**

```bash
git add web/app/routes/auth.pending.tsx
git commit -m "feat(auth): pending approval page"
```

---

### Task 3.4: 비밀번호 리셋 — 요청 페이지 `/auth/reset`

**Files:**
- Create: `web/app/routes/auth.reset.tsx`

- [ ] **Step 1: 작성**

```tsx
// web/app/routes/auth.reset.tsx
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
  if (!email) return { ok: true };  // 항상 ok 로 응답 (email enumeration 방어)

  const user = await env.DB.prepare(Q.selectUserByEmail).bind(email).first<UserRow>();
  if (user && user.status !== 'suspended' && user.status !== 'deleted') {
    const raw = await issueToken(env.DB, { userId: user.id, purpose: 'pw_reset', ttlMs: 30 * 60 * 1000 });
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
      <AuthShell title="메일을 확인해 주세요" subtitle="">
        <p className="text-[14px] text-ink-600">입력하신 이메일이 가입돼 있다면, 30분 내 만료되는 재설정 링크를 보내드렸습니다.</p>
        <p className="mt-4 text-[13px]"><Link to="/login" className="underline">로그인으로</Link></p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="비밀번호 찾기" subtitle="가입한 이메일을 입력해 주세요">
      <Form method="post" className="space-y-4">
        <Field label="이메일" type="email" name="email" required autoComplete="email" />
        <Button type="submit" loading={submitting} className="w-full">재설정 링크 보내기</Button>
      </Form>
    </AuthShell>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add web/app/routes/auth.reset.tsx
git commit -m "feat(auth): password reset request page"
```

---

### Task 3.5: 비밀번호 리셋 확인 페이지 `/auth/reset/confirm`

**Files:**
- Create: `web/app/routes/auth.reset.confirm.tsx`

- [ ] **Step 1: 작성**

```tsx
// web/app/routes/auth.reset.confirm.tsx
import { Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/auth.reset.confirm';
import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { consumeToken } from '../lib/server/tokens';
import { hashPassword, audit } from '../lib/server/auth';
import { Q } from '../lib/server/db';

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
  if (result.error) return { error: '재설정 링크가 만료되었거나 사용된 적이 있습니다.' };

  const hash = await hashPassword(password);
  await env.DB.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
    .bind(hash, Date.now(), result.userId).run();
  // 모든 기존 세션 revoke
  await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(Date.now(), result.userId).run();
  await audit(env.DB, { user_id: result.userId, action: 'pw_reset.confirm' });

  return redirect('/login?reset=1');
}

export default function ResetConfirm({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';
  return (
    <AuthShell title="새 비밀번호" subtitle="">
      <Form method="post" className="space-y-4">
        <input type="hidden" name="token" value={loaderData.token} />
        {actionData?.error && (
          <div role="alert" className="rounded-lg border border-red-300/60 bg-red-50/60 px-3.5 py-2.5 text-[13px] text-red-700">
            {actionData.error}
          </div>
        )}
        <Field label="새 비밀번호" type="password" name="password" required autoComplete="new-password" />
        <Field label="확인" type="password" name="confirm" required autoComplete="new-password" />
        <Button type="submit" loading={submitting} className="w-full">비밀번호 재설정</Button>
      </Form>
    </AuthShell>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add web/app/routes/auth.reset.confirm.tsx
git commit -m "feat(auth): password reset confirm page"
```

---

### Task 3.6: 이메일 인증 — 발송 트리거 (signup 시) + 확인 페이지

**Files:**
- Modify: `web/app/routes/signup.tsx`
- Create: `web/app/routes/auth.verify.tsx`

- [ ] **Step 1: signup action 끝에서 인증 메일 발송**

`signup.tsx` 의 redirect 직전에:

```ts
const verifyToken = await issueToken(env.DB, { userId: id, purpose: 'email_verify', ttlMs: 24 * 60 * 60 * 1000 });
const verifyLink = `${env.PUBLIC_APP_URL}/auth/verify?token=${verifyToken}`;
await makeEmailSender(env).send({
  to: email,
  subject: '[라윌티] 이메일 인증',
  text: `다음 링크로 이메일을 인증하세요 (24시간 유효):\n${verifyLink}`,
});
```

(import 도 추가)

- [ ] **Step 2: `/auth/verify` 페이지**

```tsx
// web/app/routes/auth.verify.tsx
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
  if (r.error) return { ok: false, msg: '링크가 만료되었거나 이미 사용되었습니다.' };
  await env.DB.prepare(`UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?`)
    .bind(Date.now(), Date.now(), r.userId).run();
  await audit(env.DB, { user_id: r.userId, action: 'email.verify' });
  return { ok: true, msg: '이메일이 인증되었습니다.' };
}

export default function Verify({ loaderData }: Route.ComponentProps) {
  return (
    <AuthShell title={loaderData.ok ? '인증 완료' : '인증 실패'} subtitle="">
      <p className="text-[14px] text-ink-600">{loaderData.msg}</p>
      <p className="mt-4 text-[13px]"><Link to="/login" className="underline">로그인으로</Link></p>
    </AuthShell>
  );
}
```

- [ ] **Step 3: 동작 확인**

가입 → 콘솔에 출력된 `[email]` 의 verifyLink 클릭 → "인증 완료" 표시 → DB 의 `email_verified_at` 채워졌는지 확인.

```bash
cd web && npx wrangler d1 execute lawyalty-auth --local --command "SELECT email, email_verified_at FROM users"
```

- [ ] **Step 4: 커밋**

```bash
git add web/app/routes/signup.tsx web/app/routes/auth.verify.tsx
git commit -m "feat(auth): email verification on signup"
```

---

### Task 3.7: `/auth/me` (본인 정보 조회/수정)

**Files:**
- Create: `web/app/routes/auth.me.tsx`

- [ ] **Step 1: 작성**

```tsx
// web/app/routes/auth.me.tsx — 간단 JSON 엔드포인트로 시작 (UI 는 차후)
import { redirect, data } from 'react-router';
import type { Route } from './+types/auth.me';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(context.cloudflare.env.DB, token);
  if (!user) return redirect('/login');
  return data({
    id: user.id, email: user.email, name: user.name,
    role: user.role, status: user.status,
    organization: user.organization, license_number: user.license_number,
    email_verified_at: user.email_verified_at,
  });
}

export default function Me() { return null; }  // JSON 응답 — splat 와 다르게 SPA 렌더 불필요
```

- [ ] **Step 2: 커밋**

```bash
git add web/app/routes/auth.me.tsx
git commit -m "feat(auth): /auth/me JSON endpoint"
```

---

## Milestone 4: 관리자 (사용자 승인)

### Task 4.1: admin 권한 가드 + 사용자 목록

**Files:**
- Create: `web/app/routes/admin._index.tsx`
- Modify: `web/app/lib/server/db.ts` (admin 쿼리 추가)

- [ ] **Step 1: db.ts 에 쿼리 추가**

```ts
listUsersByStatus: `SELECT id,email,name,role,status,organization,license_number,created_at,email_verified_at
                    FROM users
                    WHERE (?1 IS NULL OR status = ?1)
                    ORDER BY created_at DESC LIMIT 200`,
updateUserStatus: `UPDATE users SET status = ?, updated_at = ? WHERE id = ?`,
updateUserRole:   `UPDATE users SET role = ?,   updated_at = ? WHERE id = ?`,
```

- [ ] **Step 2: 라우트 작성**

```tsx
// web/app/routes/admin._index.tsx
import { Form, Link, redirect, useSearchParams } from 'react-router';
import type { Route } from './+types/admin._index';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';
import { Q, type UserRow } from '../lib/server/db';

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const user = await getSessionUser(env.DB, token);
  if (!user) return redirect('/login');
  if (user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');  // pending|active|suspended|null
  const rows = await env.DB.prepare(Q.listUsersByStatus).bind(status).all<UserRow>();
  return { users: rows.results, status };
}

export default function AdminIndex({ loaderData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">사용자 관리</h1>
      <nav className="flex gap-2 mb-6 text-sm">
        {['pending', 'active', 'suspended', ''].map((s) => (
          <Link key={s || 'all'} to={s ? `?status=${s}` : '/admin'}
                className={`px-3 py-1.5 rounded ${params.get('status') === s || (!params.get('status') && !s) ? 'bg-ink-700 text-white' : 'bg-silver-100'}`}>
            {s || '전체'}
          </Link>
        ))}
      </nav>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-ink-500"><th>이메일</th><th>이름</th><th>직무</th><th>상태</th><th>작업</th></tr></thead>
        <tbody>
          {loaderData.users.map((u) => (
            <tr key={u.id} className="border-t border-silver-200">
              <td className="py-2">{u.email}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td><Link to={`/admin/users/${u.id}`} className="text-ink-700 underline">관리</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add web/app/lib/server/db.ts web/app/routes/admin._index.tsx
git commit -m "feat(admin): users list with status filter (admin-only)"
```

---

### Task 4.2: admin 사용자 상세 — 승인/정지/role 변경

**Files:**
- Create: `web/app/routes/admin.users.$id.tsx`

- [ ] **Step 1: 작성**

```tsx
// web/app/routes/admin.users.$id.tsx
import { Form, redirect, useNavigation, Link } from 'react-router';
import type { Route } from './+types/admin.users.$id';
import { getSessionUser, audit } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';
import { Q, type UserRow, type UserRole } from '../lib/server/db';

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const me = await getSessionUser(env.DB, token);
  if (!me) return redirect('/login');
  if (me.role !== 'admin') return new Response('Forbidden', { status: 403 });
  const target = await env.DB.prepare(Q.selectUserById).bind(params.id).first<UserRow>();
  if (!target) return new Response('Not found', { status: 404 });
  return { target, me };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const me = await getSessionUser(env.DB, token);
  if (!me || me.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const form = await request.formData();
  const op = String(form.get('op'));
  const now = Date.now();
  if (op === 'approve') {
    await env.DB.prepare(Q.updateUserStatus).bind('active', now, params.id).run();
    await audit(env.DB, { user_id: me.id, action: 'admin.approve', target_type: 'user', target_id: params.id });
  } else if (op === 'suspend') {
    await env.DB.prepare(Q.updateUserStatus).bind('suspended', now, params.id).run();
    await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`)
      .bind(now, params.id).run();
    await audit(env.DB, { user_id: me.id, action: 'admin.suspend', target_type: 'user', target_id: params.id });
  } else if (op === 'reactivate') {
    await env.DB.prepare(Q.updateUserStatus).bind('active', now, params.id).run();
    await audit(env.DB, { user_id: me.id, action: 'admin.reactivate', target_type: 'user', target_id: params.id });
  } else if (op === 'role') {
    const role = String(form.get('role')) as UserRole;
    await env.DB.prepare(Q.updateUserRole).bind(role, now, params.id).run();
    await audit(env.DB, { user_id: me.id, action: 'admin.role', target_type: 'user', target_id: params.id, metadata: JSON.stringify({ role }) });
  }
  return redirect(`/admin/users/${params.id}`);
}

export default function AdminUser({ loaderData }: Route.ComponentProps) {
  const u = loaderData.target;
  const nav = useNavigation();
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <Link to="/admin" className="text-sm underline text-ink-500">← 목록</Link>
      <h1 className="text-2xl font-semibold">{u.name} <span className="text-ink-400 text-base">{u.email}</span></h1>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink-500">상태</dt><dd>{u.status}</dd>
        <dt className="text-ink-500">직무</dt><dd>{u.role}</dd>
        <dt className="text-ink-500">소속</dt><dd>{u.organization ?? '-'}</dd>
        <dt className="text-ink-500">자격번호</dt><dd>{u.license_number ?? '-'}</dd>
        <dt className="text-ink-500">이메일 인증</dt><dd>{u.email_verified_at ? '✓' : '-'}</dd>
      </dl>
      <div className="flex gap-2">
        {u.status === 'pending' && (
          <Form method="post"><input type="hidden" name="op" value="approve" />
            <button className="px-4 py-2 bg-ink-700 text-white rounded">승인</button>
          </Form>
        )}
        {u.status === 'active' && (
          <Form method="post"><input type="hidden" name="op" value="suspend" />
            <button className="px-4 py-2 bg-red-600 text-white rounded">정지</button>
          </Form>
        )}
        {u.status === 'suspended' && (
          <Form method="post"><input type="hidden" name="op" value="reactivate" />
            <button className="px-4 py-2 bg-ink-700 text-white rounded">재활성화</button>
          </Form>
        )}
      </div>
      <Form method="post" className="flex gap-2 items-end">
        <input type="hidden" name="op" value="role" />
        <label className="text-sm">role 변경
          <select name="role" defaultValue={u.role} className="ml-2 border rounded px-2 py-1">
            {['admin', 'lawyer', 'broker', 'architect', 'user'].map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        <button className="px-3 py-1.5 border rounded">저장</button>
      </Form>
    </div>
  );
}
```

- [ ] **Step 2: dev 에서 첫 admin 만들기 (직접 D1 update)**

가입 후:

```bash
cd web && npx wrangler d1 execute lawyalty-auth --local --command "UPDATE users SET role='admin', status='active' WHERE email='<my email>'"
```

- [ ] **Step 3: 커밋**

```bash
git add web/app/routes/admin.users.\$id.tsx
git commit -m "feat(admin): user detail page (approve / suspend / role)"
```

---

## Milestone 5: 레이트리밋 + 보안 보강

### Task 5.1: KV 레이트리밋 유틸

**Files:**
- Create: `web/app/lib/server/ratelimit.ts`
- Create: `web/test/auth/ratelimit.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
// web/test/auth/ratelimit.test.ts
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { rateLimit } from '../../app/lib/server/ratelimit';

describe('rateLimit', () => {
  it('한도 내에서 통과, 초과 시 차단', async () => {
    const key = 'test:' + Math.random();
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit(env.KV, { key, limit: 3, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
    }
    const r4 = await rateLimit(env.KV, { key, limit: 3, windowMs: 60_000 });
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 구현**

```ts
// web/app/lib/server/ratelimit.ts
export interface RateLimitOpts { key: string; limit: number; windowMs: number; }
export interface RateLimitResult { allowed: boolean; remaining: number; retryAfterSec: number; }

export async function rateLimit(kv: KVNamespace, opts: RateLimitOpts): Promise<RateLimitResult> {
  const now = Date.now();
  const raw = await kv.get(opts.key);
  let data = raw ? JSON.parse(raw) as { count: number; resetAt: number } : null;
  if (!data || data.resetAt <= now) {
    data = { count: 0, resetAt: now + opts.windowMs };
  }
  data.count += 1;
  const ttl = Math.ceil((data.resetAt - now) / 1000);
  await kv.put(opts.key, JSON.stringify(data), { expirationTtl: Math.max(ttl, 60) });
  if (data.count > opts.limit) {
    return { allowed: false, remaining: 0, retryAfterSec: ttl };
  }
  return { allowed: true, remaining: opts.limit - data.count, retryAfterSec: 0 };
}
```

- [ ] **Step 3: 통과 + 커밋**

```bash
cd web && npm test -- ratelimit
git add web/app/lib/server/ratelimit.ts web/test/auth/ratelimit.test.ts
git commit -m "feat(auth): KV rate limit util"
```

---

### Task 5.2: login / signup / pw_reset 에 레이트리밋 적용

**Files:**
- Modify: `web/app/routes/login.tsx`
- Modify: `web/app/routes/signup.tsx`
- Modify: `web/app/routes/auth.reset.tsx`

- [ ] **Step 1: login.tsx action 시작부에**

```ts
import { rateLimit } from '../lib/server/ratelimit';

const rl = await rateLimit(env.KV, {
  key: `login:${ip ?? 'noip'}:${email}`,
  limit: 5,
  windowMs: 15 * 60 * 1000,
});
if (!rl.allowed) {
  return { error: `너무 많은 시도가 있었습니다. ${Math.ceil(rl.retryAfterSec / 60)}분 후 다시 시도해 주세요.`, values: { email } };
}
```

- [ ] **Step 2: signup.tsx — IP 단위 3/시간**

```ts
const rl = await rateLimit(env.KV, { key: `signup:${ip ?? 'noip'}`, limit: 3, windowMs: 3600_000 });
if (!rl.allowed) return { errors: { general: '잠시 후 다시 시도해 주세요.' }, values };
```

- [ ] **Step 3: auth.reset.tsx — IP 단위 3/시간**

```ts
const rl = await rateLimit(env.KV, { key: `pwreset:${ip ?? 'noip'}`, limit: 3, windowMs: 3600_000 });
if (!rl.allowed) return { ok: true };  // 블랙홀로 응답 (enumeration 방어)
```

- [ ] **Step 4: 수동 테스트 — 6번 잘못된 비밀번호로 로그인 시도 → 6번째에 차단**

- [ ] **Step 5: 커밋**

```bash
git add web/app/routes/login.tsx web/app/routes/signup.tsx web/app/routes/auth.reset.tsx
git commit -m "feat(auth): rate limit login/signup/password-reset via KV"
```

---

## Milestone 6: open-webui fork — HMAC 검증 미들웨어

### Task 6.1: FastAPI 미들웨어 작성 (`webui` 브랜치 작업)

> 본 task 는 `webui` 브랜치에서 진행. main 브랜치에서는 `infra/openwebui/sso_signature.py` 에 사본만 두고 docker volume 으로 마운트해 dev 에 적용 (개발 편의), 운영 빌드는 fork 에 정식 포함.

**Files:**
- Create: `infra/openwebui/sso_signature.py`
- Modify: `infra/docker-compose.yml` (volume 마운트 + middleware 등록 환경변수)

- [ ] **Step 1: 미들웨어 작성**

```python
# infra/openwebui/sso_signature.py
import hmac, hashlib, os, time
from fastapi import Request
from fastapi.responses import JSONResponse

SSO_SECRET = os.environ.get("SSO_SECRET", "").encode()
MAX_SKEW_MS = 60_000

async def sso_signature_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/v1/auths"):
        return await call_next(request)

    email = request.headers.get("x-forwarded-email")
    name  = request.headers.get("x-forwarded-user")
    role  = request.headers.get("x-forwarded-groups")
    sig   = request.headers.get("x-forwarded-signature")
    ts    = request.headers.get("x-forwarded-timestamp")

    if not (email and name and role and sig and ts):
        return JSONResponse({"detail": "missing sso headers"}, status_code=401)
    try:
        ts_int = int(ts)
    except ValueError:
        return JSONResponse({"detail": "bad timestamp"}, status_code=401)
    if abs(int(time.time() * 1000) - ts_int) > MAX_SKEW_MS:
        return JSONResponse({"detail": "stale signature"}, status_code=401)

    canonical = f"{email}|{name}|{role}|{ts_int}".encode()
    expected = hmac.new(SSO_SECRET, canonical, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return JSONResponse({"detail": "bad signature"}, status_code=401)

    return await call_next(request)
```

- [ ] **Step 2: dev 에서 미들웨어 등록 (간단한 방법은 fork 의 `main.py` 를 수정)**

> dev 에선 fork 빌드 대신 임시로 `--mount` 로 주입하기 까다롭다. 권장: `webui` 브랜치에서 `backend/open_webui/main.py` 의 `app.add_middleware(...)` 근처에 `app.middleware('http')(sso_signature_middleware)` 등록 후 그 fork 이미지를 빌드해 사용. **이번 task 가 처음으로 webui 브랜치 코드를 건드리는 시점.**
>
> 본 plan 의 main 브랜치 단독 dev (Task 1~5) 에서는 HMAC 미들웨어 없이도 동작. localhost 만 바인드돼있어 외부에서 헤더 위조 불가. **운영 가기 전에 반드시 본 task 완료.**

- [ ] **Step 3: webui 브랜치에서 fork 이미지 빌드 + docker-compose 변경**

```yaml
# infra/docker-compose.override.yml (또는 본 compose 의 image 교체)
openwebui:
  image: lawyalty/openwebui:dev   # 로컬 빌드 태그
```

빌드:

```bash
git worktree add ../lawyalty-webui webui
cd ../lawyalty-webui
# main.py 수정 + sso_signature.py 추가
docker build -t lawyalty/openwebui:dev .
```

- [ ] **Step 4: 검증**

Worker 거치지 않은 직접 호출은 401 인지 확인:

```bash
curl -i http://localhost:8080/api/chats
```

Expected: 401 `missing sso headers`.

Worker 통한 호출 (브라우저로 5173 접속) 은 정상 200.

- [ ] **Step 5: 커밋 (양쪽 브랜치)**

main 브랜치:
```bash
git add infra/openwebui/sso_signature.py infra/docker-compose.override.yml
git commit -m "feat(infra): SSO HMAC verify middleware reference impl"
```

webui 브랜치 (worktree 안):
```bash
git add backend/open_webui/main.py backend/open_webui/sso_signature.py
git commit -m "feat: HMAC SSO signature middleware (lawyalty fork)"
```

---

## Milestone 7: 마무리 검증 + 문서

### Task 7.1: 전체 시나리오 수동 검증

- [ ] **Step 1: 클린 환경에서 처음부터**

```bash
cd infra && docker compose down -v && docker compose up -d
cd ../web && npx wrangler d1 execute lawyalty-auth --local --command "DELETE FROM users; DELETE FROM sessions; DELETE FROM one_time_tokens;"
npm run dev
```

- [ ] **Step 2: 가입 → 인증 메일 → pending → admin 승인 → 로그인 → open-webui 진입**

순서:
1. http://localhost:5173/signup 에서 두 사용자 가입 (A: 일반, B: admin 후보)
2. 콘솔의 verify link 두 개 클릭 (이메일 인증)
3. D1 으로 B 를 admin/active 강제 활성화 (위 wrangler 명령)
4. B 로 로그인 → /admin 가서 A 승인
5. A 로 로그인 → 5173 이 open-webui 채팅 화면 렌더 (게이트웨이 통해)
6. 비밀번호 리셋 흐름: 로그아웃 후 /auth/reset → 콘솔의 link → 새 비번 → 로그인 성공
7. audit_log 확인: `wrangler d1 execute ... --command "SELECT action,user_id,created_at FROM audit_log ORDER BY id DESC LIMIT 20"`

Expected: 위 모든 시나리오 통과.

- [ ] **Step 3: 보안 시나리오**

- 잘못된 비번 6회 → 6번째에 잠금 메시지
- /admin 비-admin 로 접근 → 403
- /api/chats 직접 (localhost:8080) → 401 (Task 6 완료 후)
- pending 상태로 / 접근 → /auth/pending 으로 redirect

---

### Task 7.2: 문서 업데이트

**Files:**
- Modify: `docs/lawyalty/01-auth.md`
- Modify: `docs/lawyalty/00-architecture.md`
- Modify: `README.md`

- [ ] **Step 1: 01-auth.md § 10 Phase 2 항목을 "완료 (날짜)" 로 갱신, dev 셋업 절차 추가**

- [ ] **Step 2: 00-architecture.md 의 게이트웨이 흐름 다이어그램 보강**

- [ ] **Step 3: README.md "로컬 dev 띄우는 법" 섹션 — `infra` + `web` 양쪽 절차 명시**

- [ ] **Step 4: 커밋**

```bash
git add docs/ README.md
git commit -m "docs: SSO gateway + open-webui integration setup"
```

---

## Self-Review 체크 결과

**Spec coverage** — 01-auth.md 기준
- §2 D1 스키마: 이미 마이그레이션 완료 ✅
- §3 세션 관리: 기존 구현 ✅
- §4 비밀번호: 기존 구현 ✅
- §5 OAuth: **본 plan 범위 외** (Phase 4)
- §6 SSO 헤더 브릿지: M2 + M6 ✅
- §7 권한 enforcement: M2 (status active 가드), M4 (admin role 가드) — **세부 권한 매트릭스(`/api/admin/*` 등 라우트별)는 Phase 3 에 별도 plan**
- §8 보안: lockout, rate limit, HMAC, HttpOnly cookie ✅. CSRF 별도 토큰은 본 plan 미포함 (Form post + SameSite=Lax 로 1차 방어만 — 추가 방어는 후속).
- §9 API 엔드포인트: signup/login/logout/pending/reset(req+confirm)/verify/me/admin ✅. logout-all, mfa, oauth, /auth/sessions 는 후속.
- §10 Phase: Phase 2 (헤더 SSO 브릿지) 완료. MFA·OAuth 후속.

**Placeholders 스캔** — TODO 주석 1곳 (`web/app/lib/server/email.ts` 의 Resend/SES 연동) 은 의도적 (운영 가기 전 별도 작업).

**Type 일관성** — `UserRow`, `OneTimeTokenRow`, `UserRole`, `SsoPayload` 모두 일관. `signSso/verifySso` 시그니처 일치. `proxyToWebui` 의 옵션 구조 양쪽에서 동일.

---

## 후속 plan 후보 (본 plan 범위 외)

- MFA (TOTP)
- OAuth (Google / Kakao / Naver)
- /auth/sessions 관리 + logout-all
- 라우트별 권한 매트릭스 (예: `/api/channels/create` 는 lawyer/broker/architect 만)
- CSRF token 발급/검증
- Email sender 운영 연동 (Resend / SES)
- audit_log 대시보드
- HIBP top-1000 사전 임베드
