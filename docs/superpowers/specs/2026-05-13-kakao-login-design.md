# 카카오 통합 로그인 설계

- 날짜: 2026-05-13
- 대상: `web/` (React Router 7 on Cloudflare Workers, D1)
- 관련 기존 컴포넌트: `web/app/lib/server/{auth,db,session}.ts`, `web/migrations/0001_init.sql` (`oauth_accounts` 테이블 이미 존재)

## 1. 목적

이메일/비밀번호 로그인과 함께 **카카오 로그인을 추가**해 동일한 사용자 계정으로 두 수단을 모두 사용할 수 있게 한다(통합 로그인). 카카오로 처음 로그인하는 사용자는 자동 가입·자동 승인(`status='active'`)된다.

## 2. 범위

- 카카오 OAuth 2.0 Authorization Code 흐름을 Worker에서 처리
- 카카오 프로필의 검증된 이메일로 기존 계정 자동 연동
- 신규 사용자는 즉시 `active`로 생성
- 로그인/회원가입 페이지에 카카오 버튼 추가
- 감사 로그 + state 기반 CSRF 보호

비범위(YAGNI):
- 카카오 외 다른 OAuth 공급자(구글/네이버 등)
- 계정 해제(unlink) UI
- 명시적 연동 UI("내 계정에 카카오 연결" 버튼) — 검증된 이메일로 자동 연동되므로 불필요

## 3. 사용자 시나리오

1. **신규 사용자 카카오 가입**: `/login` → "카카오로 시작" → 카카오 인증 → 자동 계정 생성(`status='active'`) → `/` 진입
2. **기존 이메일 사용자 카카오 첫 로그인**: 같은 이메일이면 카카오 식별자가 `oauth_accounts`에 추가되고 동일 user_id로 세션 발급
3. **카카오 재로그인**: `oauth_accounts` 매칭으로 즉시 세션 발급
4. **`status='pending'` 이메일 계정의 카카오 매칭**: 자동 `active`로 승격 후 로그인 허용
5. **이메일 동의 거부**: 에러 페이지("이메일 제공 동의가 필요합니다") → `/login`로 복귀

## 4. OAuth 흐름

```
GET  /auth/kakao
  → state(32B 랜덤) 생성, 쿠키로 발급(HttpOnly·Secure·SameSite=Lax, 10분 TTL)
  → https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=...&redirect_uri=...&state=...
    로 302 리다이렉트

GET  /auth/kakao/callback?code=...&state=...
  → 쿼리 state vs 쿠키 state 동등 비교 (불일치 시 reject)
  → POST https://kauth.kakao.com/oauth/token (code → access_token)
  → GET  https://kapi.kakao.com/v2/user/me (프로필 + kakao_account)
  → 매칭 로직(§ 5) 수행
  → createSession(user_id) → 세션 쿠키 발급 → 302 /
```

PKCE는 카카오 미지원이라 state만 사용. 카카오는 표준 OAuth 2.0 + client_secret을 통한 서버사이드 토큰 교환을 권장한다. state 검증은 arctic 내장 비교(쿼리 state == 쿠키 state)로 충분하며, 별도 HMAC 서명은 추가하지 않는다.

## 5. 계정 매칭 로직

콜백에서 카카오 프로필을 받은 뒤 다음 순서로 처리:

```
1. oauth_accounts WHERE provider='kakao' AND provider_user_id=<kakaoId>
   - 행 있음 → user_id로 세션 발급 (재로그인)

2. (1에 없으면) users WHERE email=<kakao_account.email> COLLATE NOCASE
   - 행 있음 →
       a. status='suspended' 또는 'deleted' → 거부
       b. status='pending' → users.status='active'로 UPDATE
       c. oauth_accounts에 (provider='kakao', provider_user_id, user_id, email, linked_at) INSERT
       d. 세션 발급

3. (2에도 없으면) 신규 users INSERT
   - id = crypto.randomUUID()
   - email = kakao_account.email
   - name = kakao_account.profile.nickname
   - password_hash = NULL
   - role = 'user'
   - status = 'active'
   - email_verified_at = now
   - created_at = updated_at = now
   - oauth_accounts INSERT, 세션 발급
```

DB 동시성: D1은 단일 statement가 atomic하나 BEGIN/COMMIT 트랜잭션은 미지원. 다중 INSERT/UPDATE는 `db.batch([...])`로 묶어 한 요청에 보낸다(부분 실패 시 전체 롤백). 동시 콜백이 같은 사용자에 대해 `oauth_accounts`를 INSERT하는 race는 PRIMARY KEY(`provider`,`provider_user_id`) 충돌로 막히므로, INSERT 실패 시 SELECT 후 매칭으로 1회 재시도한다.

## 6. 신규 사용자 필드 매핑

| users 필드          | 값                                             |
| ------------------- | ---------------------------------------------- |
| `id`                | `crypto.randomUUID()`                          |
| `email`             | `kakao_account.email` (소문자 변환)            |
| `name`              | `kakao_account.profile.nickname`               |
| `password_hash`     | `NULL`                                         |
| `role`              | `'user'`                                       |
| `status`            | `'active'`                                     |
| `email_verified_at` | `Date.now()`                                   |
| `created_at`        | `Date.now()`                                   |
| `updated_at`        | `Date.now()`                                   |

## 7. 에러 처리

콜백에서 다음 조건이면 `/login?error=<code>`로 리다이렉트하고 로그인 페이지가 메시지를 표시:

| 코드                    | 트리거                                                                 | 사용자 메시지                                         |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `kakao_state_mismatch`  | state 쿠키 부재 또는 불일치                                            | 인증 세션이 만료되었습니다. 다시 시도해 주세요.       |
| `kakao_email_required`  | `kakao_account.email` 없음 또는 `is_email_verified=false`              | 이메일 제공 동의가 필요합니다. 동의 후 다시 시도해 주세요. |
| `kakao_account_suspended` | 매칭된 user.status='suspended'                                       | 계정이 정지되었습니다. 관리자에게 문의해 주세요.       |
| `kakao_account_deleted` | 매칭된 user.status='deleted'                                          | 사용할 수 없는 계정입니다.                            |
| `kakao_token_failed`    | 토큰 교환 실패 (네트워크/잘못된 code)                                  | 카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요. |

모든 실패는 `audit_log`에 `kakao.login.fail` + metadata(reason)로 기록.

## 8. 감사 로그 액션

| 액션                    | 발생 시점                                  |
| ----------------------- | ------------------------------------------ |
| `kakao.login.start`     | `/auth/kakao` 진입(state 발급) 시          |
| `kakao.login.success`   | 기존 oauth_accounts 매칭으로 로그인 성공   |
| `kakao.signup.success`  | 신규 user 생성 + 로그인                    |
| `kakao.link.success`    | 기존 이메일 user에 oauth_accounts 연결     |
| `kakao.login.fail`      | 어떤 사유로든 실패 (metadata에 reason)     |

## 9. UI

`/login`, `/signup` 페이지 폼 하단에 구분선과 카카오 버튼 추가.

```
[이메일]
[비밀번호]
[로그인 버튼]
─── 또는 ───
[🟡 카카오로 시작하기]   ← <Link to="/auth/kakao">
```

스타일: 카카오 브랜드 가이드 준수 — `#FEE500` 배경, 검정 텍스트, 카카오 심볼 SVG. 컴포넌트는 `web/app/components/KakaoButton.tsx`로 분리.

쿼리 `?error=<code>`가 있으면 로그인 페이지가 해당 메시지를 표시(§ 7).

## 10. 라이브러리

**`arctic`** 사용. 이유:
- Cloudflare Workers/Edge 런타임 호환 (Web Crypto만 사용)
- Kakao provider 내장 (`new Kakao(clientId, clientSecret, redirectURI)`)
- state 생성·검증, 토큰 교환 표준 처리
- 약 30줄로 동등 구현 가능

대안 검토:
- DIY fetch: ~150줄, state HMAC을 직접 구현해야 함. 의존성 0이 의미 있을 정도의 차이는 아님.
- auth.js: 무겁고 RR7 + Workers 통합 불편. 비추.

## 11. 환경 변수 / 시크릿

`.dev.vars` (개발) + `wrangler secret put` (운영):

```
KAKAO_CLIENT_ID       = <카카오 REST API 키>
KAKAO_CLIENT_SECRET   = <카카오 콘솔에서 발급, ON 상태>
KAKAO_REDIRECT_URI    = ${PUBLIC_APP_URL}/auth/kakao/callback
```

`worker-configuration.d.ts` (wrangler types로 자동 생성)에 위 키들이 포함되도록 `wrangler.toml`의 `vars`/`secret` 정의 또는 binding 갱신.

## 12. 카카오 콘솔 체크리스트 (사용자 수동 작업)

- [ ] **카카오 로그인** → 활성화 ON
- [ ] **Redirect URI** 등록
  - `http://localhost:5174/auth/kakao/callback` (dev)
  - `https://lawyalty.com/auth/kakao/callback` (prod)
- [ ] **동의항목**
  - 닉네임: 필수 동의
  - 카카오계정(이메일): 필수 동의
- [ ] **Client Secret**: 발급 + "사용함" 상태로 설정
- [ ] **보안 → 사이트 도메인**: `https://lawyalty.com`, `http://localhost:5174`

## 13. 파일 변경 목록

신규:
- `web/app/routes/auth.kakao.tsx` — `/auth/kakao` loader(state 발급 + 리다이렉트)
- `web/app/routes/auth.kakao.callback.tsx` — `/auth/kakao/callback` loader(콜백 처리)
- `web/app/lib/server/kakao.ts` — arctic 클라이언트 + 매칭 로직 + DB 헬퍼
- `web/app/components/KakaoButton.tsx` — 카카오 노란 버튼 컴포넌트
- 테스트 파일 (§ 14)

수정:
- `web/app/routes.ts` — 신규 라우트 등록
- `web/app/routes/login.tsx`, `web/app/routes/signup.tsx` — 카카오 버튼 추가, `error` 쿼리 처리
- `web/app/lib/server/db.ts` — `Q.selectOauthAccount`, `Q.insertOauthAccount`, `Q.updateUserStatus` 등 쿼리 추가
- `package.json` — `arctic` 의존성 추가
- `web/.dev.vars`, `web/wrangler.jsonc` — 카카오 시크릿 키 슬롯 추가

## 14. 테스트 (vitest + `@cloudflare/vitest-pool-workers`)

- **매칭 로직 단위 테스트** (`web/app/lib/server/kakao.test.ts`)
  - 신규 사용자 → users + oauth_accounts INSERT, status='active'
  - 동일 이메일 user 존재 → oauth_accounts만 INSERT, 기존 user 재사용
  - pending status user → active로 승격 후 oauth_accounts INSERT
  - oauth_accounts 이미 존재 → 단순 세션 발급
  - status='suspended' user → reject
- **콜백 라우트** (`web/app/routes/auth.kakao.callback.test.ts`)
  - state mismatch → `/login?error=kakao_state_mismatch`
  - 카카오 응답에 email 없음 → `/login?error=kakao_email_required`
  - 정상 → `/` + Set-Cookie
- 카카오 응답 fixture는 `web/test/fixtures/kakao-*.json`에 보관, `fetch` mock으로 주입.

## 15. 비기능 요구사항

- 콜백 처리 < 1초 (카카오 API 응답 시간 제외)
- 모든 카카오 시크릿은 환경변수, 코드에 하드코딩 금지
- 카카오 access_token은 메모리에서만 사용 후 폐기 (DB 저장 X — 우리는 OAuth를 로그인 수단으로만 사용)
