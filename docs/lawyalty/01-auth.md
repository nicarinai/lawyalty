# 라윌티 인증 시스템

> 전제: Cloudflare D1 = 인증 source of truth. open-webui = 헤더 SSO 클라이언트.

## 목차
- [1. 설계 원칙](#1-설계-원칙)
- [2. D1 스키마](#2-d1-스키마)
- [3. 세션 관리](#3-세션-관리)
- [4. 비밀번호 정책](#4-비밀번호-정책)
- [5. OAuth (확장)](#5-oauth-확장)
- [6. SSO 헤더 브릿지](#6-sso-헤더-브릿지)
- [7. 권한 enforcement](#7-권한-enforcement)
- [8. 보안 위협 모델](#8-보안-위협-모델)
- [9. API 엔드포인트](#9-api-엔드포인트)

---

## 1. 설계 원칙

1. **Source of Truth = Cloudflare D1** — 사용자 식별·비밀번호·세션·권한은 모두 D1. open-webui DB 의 user 테이블은 **mirror** (헤더 SSO 로 자동 생성/매칭).
2. **세션 = HttpOnly + Secure 쿠키** — JWT 는 쿠키 내부 페이로드. 클라이언트 JS 는 토큰을 절대 보지 않음.
3. **헤더 위조 방어 다층** — Cloudflare IP 화이트리스트 + 홈서버 방화벽 + 헤더 서명 (HMAC).
4. **Audit-by-default** — 로그인·로그아웃·권한 변경·실패 시도 모두 D1 audit_log 에 기록. KV 가 아닌 영구 저장.
5. **Pending 단계 강제** — 신규 가입자는 `status='pending'`. admin 승인까지 채팅·채널·노트 모두 차단.
6. **Rate limit 은 KV** — 로그인 5회/15분, 가입 3회/시간/IP, 비밀번호 리셋 3회/시간.

## 2. D1 스키마

```sql
-- 사용자
CREATE TABLE users (
  id              TEXT PRIMARY KEY,           -- uuid v4
  email           TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name            TEXT NOT NULL,
  password_hash   TEXT,                        -- argon2id (NULL 이면 OAuth-only)
  role            TEXT NOT NULL DEFAULT 'user', -- admin|lawyer|broker|architect|user
  status          TEXT NOT NULL DEFAULT 'pending', -- pending|active|suspended|deleted
  email_verified_at INTEGER,                   -- unix sec
  phone           TEXT,                        -- 한국 +82-10-...
  phone_verified_at INTEGER,
  organization    TEXT,                        -- 사무소·소속
  license_number  TEXT,                        -- 자격번호 (변호사 등록번호 등)
  mfa_enabled     INTEGER DEFAULT 0,           -- 0|1
  mfa_secret      TEXT,                        -- TOTP base32 (암호화)
  failed_login_count INTEGER DEFAULT 0,
  locked_until    INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  last_login_at   INTEGER
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 세션 (rotating)
CREATE TABLE sessions (
  token_hash      TEXT PRIMARY KEY,            -- sha256(opaque token)
  user_id         TEXT NOT NULL,
  expires_at      INTEGER NOT NULL,
  refresh_until   INTEGER NOT NULL,            -- 이 이후 자동 로그아웃
  ip              TEXT,
  user_agent      TEXT,
  created_at      INTEGER NOT NULL,
  last_used_at    INTEGER NOT NULL,
  revoked_at      INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 권한 (사용자별 추가 권한 — role 기본 권한 위에 덮어쓰기)
CREATE TABLE user_permissions (
  user_id         TEXT NOT NULL,
  permission      TEXT NOT NULL,               -- e.g. 'workspace.models.read'
  granted_by      TEXT NOT NULL,
  granted_at      INTEGER NOT NULL,
  PRIMARY KEY (user_id, permission),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- 그룹 (선택, 향후 팀 기능 대비)
CREATE TABLE groups (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  created_at      INTEGER NOT NULL
);

CREATE TABLE group_members (
  group_id        TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member', -- member|moderator|owner
  joined_at       INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 이메일 인증·비밀번호 리셋·매직링크 토큰
CREATE TABLE one_time_tokens (
  token_hash      TEXT PRIMARY KEY,            -- sha256
  user_id         TEXT NOT NULL,
  purpose         TEXT NOT NULL,               -- email_verify|pw_reset|magic_link
  expires_at      INTEGER NOT NULL,
  used_at         INTEGER,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 감사 로그
CREATE TABLE audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT,                        -- NULL 가능 (로그인 실패 등)
  action          TEXT NOT NULL,               -- login.success|login.fail|signup|...
  target_type     TEXT,                        -- 'user'|'session'|'permission'
  target_id       TEXT,
  ip              TEXT,
  user_agent      TEXT,
  metadata        TEXT,                        -- JSON
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_action ON audit_log(action, created_at);

-- OAuth 연동
CREATE TABLE oauth_accounts (
  provider        TEXT NOT NULL,               -- 'google'|'kakao'|'naver'
  provider_user_id TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  email           TEXT,
  linked_at       INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 3. 세션 관리

### 토큰 발급
- 로그인 성공 시 **opaque token** (32바이트 random base64url) 생성
- D1 에는 sha256 해시만 저장 (`token_hash`)
- 클라이언트에는 raw token 을 **HttpOnly Secure SameSite=Lax 쿠키**로 전달 (`Path=/`, `Domain=.lawyalty.com`)
- 쿠키 이름: `lawyalty_session`
- 만료: `expires_at = now + 7d`, `refresh_until = now + 30d`

### Sliding session
- 매 요청마다 `last_used_at` 업데이트
- `expires_at` 이 24시간 이내로 남으면 자동 갱신 (rolling)
- `refresh_until` 초과 시 강제 로그아웃 (절대 시한)

### 로그아웃
- `sessions.revoked_at` 에 timestamp 기록 → 같은 token 재사용 차단
- "모든 기기 로그아웃" = 해당 user_id 의 모든 세션 revoke

## 4. 비밀번호 정책

- **해시**: argon2id (memory=64MB, iterations=3, parallelism=4)
- **최소 요건**: 10자 이상, 영문+숫자+특수문자 중 2종류 이상
- **약한 비밀번호 차단**: HIBP top-1000 사전 (Worker 에 임베드)
- **재설정 토큰**: 30분 만료, 1회 사용
- **변경 시**: 모든 기존 세션 revoke

## 5. OAuth (확장)

Phase 2 이후:
- **Google** (직장 이메일 도메인용)
- **Kakao** (한국 일반 사용자)
- **Naver** (한국 직장인)

플로우:
1. `/auth/oauth/{provider}` → provider authorize URL 리다이렉트
2. 콜백에서 token 교환 → 사용자 정보 조회
3. `oauth_accounts` 에 매칭되면 그 user 로 로그인
4. 매칭 없으면 email 로 `users` 조회 → 있으면 link, 없으면 신규 가입 (status=pending)
5. 신규 가입은 admin 승인 후 활성화

## 6. SSO 헤더 브릿지

### Worker → 홈서버 프록시 로직

```ts
// Cloudflare Worker (의사 코드)
async function handleApi(request: Request, env: Env) {
  const session = await verifySession(request, env.D1);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await env.D1
    .prepare('SELECT id, email, name, role, status FROM users WHERE id = ?')
    .bind(session.user_id)
    .first();

  if (!user || user.status !== 'active') {
    return new Response('Forbidden', { status: 403 });
  }

  // 홈서버로 프록시할 헤더
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('X-Forwarded-Email', user.email);
  upstreamHeaders.set('X-Forwarded-User', user.name);
  upstreamHeaders.set('X-Forwarded-Groups', user.role);

  // HMAC 서명 — 헤더 위조 방어 (홈서버에서 검증)
  const sig = await hmacSha256(env.SSO_SECRET,
    `${user.email}|${user.name}|${user.role}|${Date.now()}`
  );
  upstreamHeaders.set('X-Forwarded-Signature', sig);
  upstreamHeaders.set('X-Forwarded-Timestamp', String(Date.now()));

  // 클라이언트 쿠키 제거 — 홈서버는 헤더만 본다
  upstreamHeaders.delete('Cookie');

  return fetch(`${env.UPSTREAM_URL}${url.pathname}${url.search}`, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.body,
  });
}
```

### 홈서버 검증 (FastAPI middleware 추가 필요)

```python
# backend/open_webui/middleware/sso_signature.py (커스텀 추가)
@app.middleware('http')
async def verify_sso_signature(request: Request, call_next):
    if request.url.path.startswith('/api/v1/auths'):
        return await call_next(request)  # 자체 가입은 어차피 비활성

    email = request.headers.get('X-Forwarded-Email')
    sig = request.headers.get('X-Forwarded-Signature')
    ts = request.headers.get('X-Forwarded-Timestamp')

    if email and sig and ts:
        if abs(time.time() * 1000 - int(ts)) > 60_000:
            return JSONResponse({'detail': 'stale'}, 401)
        expected = hmac_sha256(SSO_SECRET, f'{email}|{name}|{role}|{ts}')
        if not hmac.compare_digest(sig, expected):
            return JSONResponse({'detail': 'bad signature'}, 401)
    return await call_next(request)
```

### 홈서버 env

```bash
WEBUI_AUTH_TRUSTED_EMAIL_HEADER=X-Forwarded-Email
WEBUI_AUTH_TRUSTED_NAME_HEADER=X-Forwarded-User
WEBUI_AUTH_TRUSTED_GROUPS_HEADER=X-Forwarded-Groups
ENABLE_SIGNUP=false
ENABLE_LOGIN_FORM=false
SSO_SECRET=<32바이트 랜덤, Worker 와 공유>
FORWARDED_ALLOW_IPS=<Cloudflare IP CIDR 목록>
```

## 7. 권한 enforcement

### 두 단계
1. **Edge (Worker)** — role 기반 라우트 차단. 빠른 거부.
2. **Backend (open-webui)** — 데이터 스코프 enforcement. user_id 기반 row-level 필터.

### 권한 체크 매트릭스

| Role | `/api/channels/create` | `/api/notes/{id}/access/update` | `/admin/*` |
|---|---|---|---|
| admin | ✅ | ✅ | ✅ |
| lawyer | ✅ | 본인 노트만 | ❌ |
| broker | ✅ | 본인 노트만 | ❌ |
| user | ❌ (참여만) | 본인 노트만 | ❌ |
| pending | ❌ | ❌ | ❌ |

### Worker 에서 라우트 가드 예시

```ts
const routePermissions = {
  '/api/admin/*': ['admin'],
  '/api/channels/create': ['admin', 'lawyer', 'broker', 'architect'],
  '/api/notes/*/access/update': ['admin', 'lawyer', 'broker', 'architect', 'user'],
  '/api/v1/auths/admin/*': ['admin'],
};
```

## 8. 보안 위협 모델

| 위협 | 완화책 |
|---|---|
| 헤더 위조 (홈서버 직접 호출) | Cloudflare IP 화이트리스트 + HMAC 서명 + timestamp |
| 세션 탈취 (XSS) | HttpOnly 쿠키, CSP `default-src 'self'`, sanitize 모든 user-generated content |
| CSRF | SameSite=Lax + 별도 CSRF token (`/api/csrf-token` 발급) |
| 비밀번호 무차별 대입 | KV 레이트 리미트 (5회/15분/email+IP), 점진 lock (`failed_login_count` → `locked_until`) |
| 가입 폭탄 | KV 레이트 리미트 (3회/시간/IP), 이메일 인증 강제 |
| Session fixation | 로그인 성공 시 새 토큰 발급 (기존 토큰 무효) |
| Replay (헤더 timestamp) | timestamp ±60초 이내만 유효 |
| 권한 상승 | role 변경은 admin 만, audit_log 강제 기록 |
| 토큰 leak (URL 파라미터) | password reset 외엔 절대 URL 에 토큰 안 실음 |

## 9. API 엔드포인트

### 인증 (Cloudflare Worker / SvelteKit `+server.ts`)

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/auth/signup` | 공개 | 가입 (status=pending) |
| POST | `/auth/login` | 공개 | 로그인 → 세션 쿠키 |
| POST | `/auth/logout` | 세션 | 현재 세션 revoke |
| POST | `/auth/logout-all` | 세션 | 모든 세션 revoke |
| POST | `/auth/password/reset/request` | 공개 | 리셋 메일 발송 |
| POST | `/auth/password/reset/confirm` | 토큰 | 새 비밀번호 |
| POST | `/auth/email/verify/request` | 세션 | 인증 메일 재발송 |
| GET | `/auth/email/verify` | 토큰 | 이메일 인증 (URL 클릭) |
| POST | `/auth/mfa/setup` | 세션 | TOTP 시크릿 발급 |
| POST | `/auth/mfa/confirm` | 세션 + code | MFA 활성화 |
| GET | `/auth/me` | 세션 | 본인 정보 |
| PATCH | `/auth/me` | 세션 | 프로필 수정 |
| GET | `/auth/sessions` | 세션 | 활성 세션 목록 |
| DELETE | `/auth/sessions/{id}` | 세션 | 특정 세션 종료 |
| GET | `/auth/oauth/{provider}` | 공개 | OAuth 시작 |
| GET | `/auth/oauth/{provider}/callback` | 공개 | OAuth 콜백 |

### 관리 (admin only)

| Method | Path | 설명 |
|---|---|---|
| GET | `/admin/users` | 사용자 목록 (페이지네이션) |
| PATCH | `/admin/users/{id}` | role · status 변경 |
| POST | `/admin/users/{id}/approve` | pending → active |
| POST | `/admin/users/{id}/suspend` | active → suspended |
| GET | `/admin/audit-log` | 감사 로그 조회 |

## 10. 마이그레이션 / Phase 진행

### Phase 0 (현재)
- 로컬 dev 에서 open-webui 자체 인증으로 동작 확인
- 첫 가입자가 admin

### Phase 1
- D1 마이그레이션 작성 (`migrations/001_init.sql`)
- SvelteKit `/auth/login`, `/auth/signup` 라우트 + D1 binding
- 로컬 wrangler dev 환경에서 테스트

### Phase 2
- Cloudflare Worker 프록시 + SSO 헤더 주입
- 홈서버 측 HMAC verify middleware 추가
- 자체 가입/로그인 차단 (`ENABLE_SIGNUP=false`)

### Phase 3
- 권한 매트릭스 enforcement
- audit log 대시보드
- MFA 도입

### Phase 4
- OAuth (Google · Kakao)
- 그룹 기능
