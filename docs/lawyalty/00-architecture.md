# 라윌티 시스템 아키텍처

> 결정 시기: 2026-05-05
> 베이스: open-webui v0.9.2 fork (`webui` branch)

## 개요

라윌티는 건축법령·부동산 규제 검토를 위한 **AI + 협업 워크스페이스**다. open-webui 의 채팅·채널·노트·RAG 기능을 베이스로, **Cloudflare 엣지 인증** 과 **자체 권한 모델** 을 얹어 한국 법무·중개·건축사 도메인에 특화한다.

## 시스템 구성

```
┌──────────────────────────────────────────────────────────────────────┐
│                         사용자 브라우저                                │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTPS (CDN)
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Cloudflare Edge (lawyalty.com)                                       │
│                                                                       │
│  ┌──────────────────────┐    ┌──────────────────────┐                │
│  │ Pages: SvelteKit     │    │ Worker: API Proxy    │                │
│  │  - 라윌티 라우트       │◀──▶│  - 세션 검증         │                │
│  │  - 로그인/가입 UI     │    │  - 헤더 주입(SSO)    │                │
│  │  - 라윌티 디자인 시스템│    │  - 레이트 리미트       │                │
│  └──────────────────────┘    └──────────┬───────────┘                │
│                                          │                            │
│  ┌──────────────────────┐    ┌──────────▼───────────┐                │
│  │ D1 (SQLite)          │    │ KV                   │                │
│  │  users, sessions,    │    │  rate_limits,        │                │
│  │  permissions, audit  │    │  short_lived_tokens  │                │
│  └──────────────────────┘    └──────────────────────┘                │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTPS + WSS (Cloudflare IP only)
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  홈서버 (사용자 자가 호스팅)                                            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Docker Compose                                                │   │
│  │  - open-webui (FastAPI + WebSocket)                           │   │
│  │  - Postgres (chats · channels · notes · knowledge)           │   │
│  │  - Redis (세션 broadcast, multi-worker scale)                  │   │
│  │  - Ollama (선택, 로컬 LLM)                                     │   │
│  │  - Vector DB (Qdrant 또는 PGVector)                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                    ┌──────────────┐                                  │
│                    │ OpenRouter   │ (외부 LLM API)                   │
│                    │ Anthropic    │                                  │
│                    │ OpenAI       │                                  │
│                    └──────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

## 책임 분리

| 레이어 | 책임 | 기술 |
|---|---|---|
| **Cloudflare Pages** | 라윌티 SPA, 로그인/가입 UI, 정적 자산 | SvelteKit + Cloudflare Adapter |
| **Cloudflare Worker** | 인증 게이트, 세션 관리, API 프록시, 레이트 리미트 | Workers + Hono / SvelteKit hooks |
| **Cloudflare D1** | 사용자·세션·권한·감사 로그 (인증의 단일 source of truth) | SQLite |
| **Cloudflare KV** | TTL 기반 단기 데이터 (레이트 리미트, OTP 토큰) | KV |
| **홈서버 open-webui** | 채팅·채널·노트·RAG·LLM 라우팅 (헤더 SSO 신뢰) | FastAPI + Postgres |
| **홈서버 Postgres** | open-webui 의 채팅/채널/노트/지식 데이터 | Postgres 16 |
| **홈서버 Vector DB** | RAG 임베딩 (법령·판례 코퍼스) | Qdrant |
| **외부 LLM** | 추론 (한국어 법령 응답 품질) | OpenRouter / Anthropic |

## 인증 플로우 (Trusted Header SSO)

1. 사용자가 라윌티에 접속 → Cloudflare Pages 가 SvelteKit 앱 서빙
2. 로그인/가입은 SvelteKit 라우트에서 처리 → D1 에 user/session 저장 → 세션 쿠키 발급
3. 사용자가 채팅·채널·노트 기능 사용 시 `/api/*` 호출
4. Cloudflare Worker 가 세션 검증 → D1 에서 user lookup → 홈서버로 프록시할 때 신뢰 헤더 주입
   - `X-Forwarded-Email`
   - `X-Forwarded-User`
   - `X-Forwarded-Groups`
5. 홈서버 open-webui 는 `WEBUI_AUTH_TRUSTED_EMAIL_HEADER` 모드로 동작 → 헤더 값으로 user 매칭/생성
6. open-webui 의 자체 회원가입/로그인 폼은 `ENABLE_SIGNUP=false`, `ENABLE_LOGIN_FORM=false` 로 차단

> 헤더 위조 방어: 홈서버 방화벽에 **Cloudflare IP 대역만 화이트리스트**. `FORWARDED_ALLOW_IPS` 도 동일하게 제한.

## 데이터 모델 분리 원칙

- **인증·권한** (Cloudflare D1) — Lawyalty 가 source of truth
- **콘텐츠** (홈서버 Postgres) — open-webui 가 관리. Lawyalty 의 user_id 는 email 로 join
- 닉네임·역할 변경 시 양쪽 동기화 필요 (헤더 SSO 가 매 요청마다 user info 를 보내므로 자동 동기화됨)

## 도메인 구성 (예정)

- `lawyalty.com` — 메인 SPA (Cloudflare Pages)
- `api.lawyalty.com` — Worker 프록시 (홈서버로 라우팅)
- `wss.lawyalty.com` — WebSocket 프록시 (채널·실시간)
- 홈서버는 외부 노출 X — Cloudflare Tunnel 또는 IP 화이트리스트로만 접근

## 권한 매트릭스

| Role | 채팅 | 채널 (Discord 식) | 노트 (Notion 식) | 모델/지식 관리 | Admin Panel |
|---|---|---|---|---|---|
| **admin** | ✅ | ✅ 생성·관리 | ✅ 모든 노트 | ✅ | ✅ |
| **lawyer** (변호사·법무사) | ✅ | ✅ 생성 | ✅ 본인 + 공유받은 | ❌ | ❌ |
| **broker** (공인중개사) | ✅ | ✅ 참여 | ✅ 본인 + 공유받은 | ❌ | ❌ |
| **architect** (건축사) | ✅ | ✅ 참여 | ✅ 본인 + 공유받은 | ❌ | ❌ |
| **user** (일반 건축주) | ✅ | 읽기만 | 본인 노트만 | ❌ | ❌ |
| **pending** | 제한 | ❌ | ❌ | ❌ | ❌ |

## 배포 단계

1. **Phase 0** — 로컬 dev (현재) — open-webui 풀 스택 로컬에서 동작 확인
2. **Phase 1** — Cloudflare 프론트 + 홈서버 백엔드 분리, SSO 헤더 브릿지
3. **Phase 2** — D1 인증 + 권한 매트릭스 + 라윌티 디자인 시스템 적용
4. **Phase 3** — 법령 코퍼스 RAG 인덱싱 + 도메인 프롬프트 튜닝
5. **Phase 4** — 베타 (50 user 미만) — 라윌티 브랜드만 노출 가능
6. **Phase 5** — 정식 출시 — Open WebUI attribution 푸터 추가 또는 엔터프라이즈 라이선스 검토

## 관련 문서

- [01-auth.md](./01-auth.md) — 인증 시스템 상세 (D1 스키마, 세션, SSO 브릿지)
- [02-auth-ui.md](./02-auth-ui.md) — 로그인/회원가입 화면 설계 스펙
