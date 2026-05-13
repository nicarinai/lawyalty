# Lawyalty

> **Law + Loyalty** — 부동산 거래에 꼭 필요한 법률 정보를, 가장 믿을 수 있는 형태로.

Lawyalty는 공공 법률 API의 **현행 법령·판례·행정규칙**을 근거로 AI가 부동산 법률 질문에 답하는 웹 애플리케이션입니다. 임대차·매매·등기·재개발·세금 등 일반인이 접근하기 어려운 영역을 **출처 기반(grounded)** 으로 풀어냅니다.

> ⚠️ 초기 개발(draft) 단계. 구조·스펙은 자주 변경됩니다.

---

## 🏛️ Architecture

라윌티는 **두 개의 프론트엔드 + 한 개의 백엔드** 로 구성됩니다.

```
                  ┌──────────────────────────────┐
[브라우저] ─────▶ │ Cloudflare (라윌티 인증 게이트) │
                  │ React Router 7 + Workers + D1 │
                  └──────────┬───────────────────┘
                             │ 세션 검증 후 SSO 헤더 + HMAC
                             ▼
                  ┌──────────────────────────────┐
                  │  홈서버 Docker (open-webui)   │
                  │  SvelteKit + FastAPI + LLM    │
                  └──────────────────────────────┘
```

| 구분 | 브랜치 | 스택 | 호스팅 | 책임 |
|---|---|---|---|---|
| **인증 게이트** | `main` | React Router 7 (Vite) + Tailwind v4 + D1 + KV | Cloudflare Pages/Workers | 로그인, 회원가입, MFA, 비밀번호 재설정, 관리자 승인, SSO 헤더 발급 |
| **앱 본체** | `webui` | open-webui (SvelteKit + FastAPI) | 자체 홈서버 Docker | AI 채팅, 채널, 노트, RAG, 법령 검색 |

> 결정 (2026-05-05): open-webui 를 백엔드로 채택. 라윌티 자체 인증/권한은 Cloudflare 측에서 D1 으로 직접 구현하고, 홈서버에는 SSO 헤더 브릿지로 사용자 신원을 전달합니다.

---

## ✨ Key Features

- **부동산 법률 검색** — 국가법령정보센터 등 공공 API 실시간 검색
- **AI 법률 Q&A** — 검색 결과를 근거로 LLM 응답 (RAG)
- **출처 링크** — 모든 답변에 법령·조문·판례 원문 링크 동봉
- **시나리오 가이드** — 임대차, 보증금 반환, 전세사기, 매매, 등기, 세금
- **대화형 인터페이스** — 꼬리질문으로 상황별 답 도달
- **채널·노트** — Discord 식 채널 + Notion 식 협업 노트 (open-webui)

---

## 🧱 Tech Stack

### Frontend (인증 게이트, `main`)
- **React Router 7** (framework mode, post-Remix merger)
- **Vite** + Cloudflare Vite plugin
- **Tailwind CSS v4** (`@theme {}` CSS-first 토큰) + 라윌티 리퀴드 글래스 유틸리티
- **Cloudflare D1** (SQLite) — users, sessions, permissions, audit_log
- **Cloudflare KV** — rate limit, 일회성 토큰
- **argon2id** via `@noble/hashes` (Workers 호환 순수 JS)
- 세션: HttpOnly Secure SameSite=Lax 쿠키 + sliding 7d / hard 30d

### Backend (앱 본체, `webui`)
- **open-webui** (SvelteKit 프론트 + FastAPI 백)
- **Docker Compose** 홈서버 구동
- **LLM 라우팅** — OpenAI / Anthropic Claude / Ollama (Gemma) / OpenRouter
- **법령 데이터** — [국가법령정보센터 Open API](https://open.law.go.kr/), 대법원 판례
- **WebSocket** 채널 메시징, **ProseMirror** 협업 노트

### SSO 브릿지 (Phase 2)
- 라윌티 측에서 사용자 검증 후 `X-Forwarded-User` + HMAC 서명 헤더로 홈서버에 전달
- 홈서버는 IP 화이트리스트 + HMAC verify 미들웨어로 신뢰

---

## 📁 Project Structure

```
lawyalty/
├── web/                    # React Router 7 인증 게이트 (Cloudflare)
│   ├── app/
│   │   ├── routes/         # login, signup, logout, _index, ...
│   │   ├── components/     # AuthShell, Field, Button (리퀴드 글래스)
│   │   └── lib/server/     # auth.ts (argon2id), db.ts, session.ts
│   ├── migrations/         # D1 SQL 마이그레이션
│   ├── workers/app.ts
│   ├── wrangler.jsonc
│   └── .dev.vars           # 로컬 개발용 (gitignore)
├── docs/lawyalty/          # 설계 문서
│   ├── 00-architecture.md
│   ├── 01-auth.md          # D1 스키마 + 세션 + SSO
│   └── 02-auth-ui.md       # 9개 인증 화면 설계
├── design-systems/         # DESIGN.md
├── web-nextjs-legacy/      # 구 Next.js 프로토타입 (보존)
└── server/                 # (예정) 홈서버 배포 설정
```

`webui` 브랜치에는 [open-webui](https://github.com/open-webui/open-webui) 포크가 그대로 들어가며 `main` 과는 코드를 공유하지 않습니다.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+, npm
- Cloudflare 계정 (D1 / KV / Pages 사용)
- 홈서버 (Docker 가능한 환경, open-webui 운용용)

### 인증 게이트 로컬 실행

```bash
git clone https://github.com/nicarinai/lawyalty.git
cd lawyalty/web
npm install

# .dev.vars 작성 (gitignore 됨)
cat > .dev.vars <<'EOF'
PUBLIC_APP_URL=http://localhost:5173
WEBUI_BASE_URL=http://localhost:5173
UPSTREAM_URL=http://localhost:8080
SSO_SECRET=<infra/.env 와 동일 값>
EOF

# D1 로컬 마이그레이션
npx wrangler d1 migrations apply lawyalty-auth --local

# 테스트
npm test

# dev 서버
npm run dev
```

접속: <http://localhost:5173> — 인증 라우트는 직접 처리, 그 외 경로는
업스트림(open-webui) 으로 SSO 헤더와 함께 프록시됩니다.

### open-webui + Postgres (로컬 dev)

```bash
cd infra
cp .env.example .env
# .env 에 WEBUI_SECRET_KEY, SSO_SECRET (web/.dev.vars 와 동일 값) 채우기
docker compose up -d
```

open-webui: <http://localhost:8080> (dev 한정 직접 접속).
운영 환경에서는 외부에서 게이트웨이 도메인만 노출하고, open-webui 는 내부망에만 두세요.
fork 빌드 (`webui` 브랜치) 에 HMAC 검증 미들웨어를 포함해 헤더 위조를 차단합니다.

### 환경 변수

| 키 | 위치 | 용도 |
|---|---|---|
| `PUBLIC_APP_URL` | wrangler / .dev.vars | 라윌티 프론트 자체 URL |
| `WEBUI_BASE_URL` | wrangler / .dev.vars | 로그인 후 리다이렉트 대상 (홈서버 open-webui) |
| `UPSTREAM_URL` | wrangler / .dev.vars | 게이트웨이 → open-webui 프록시 대상 |
| `SSO_SECRET` | wrangler secret / .dev.vars | SSO 헤더 HMAC 서명 키 (Worker 와 open-webui fork 가 공유) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | open-webui | LLM 라우팅 |
| `LAW_API_KEY` | open-webui | 국가법령정보센터 |

---

## 🗺️ Roadmap

라윌티는 6단계 Phase 로 진행됩니다 (`docs/lawyalty/00-architecture.md`).

- [x] **Phase 0** — 설계 문서, 디자인 시스템, 아키텍처 결정
- [x] **Phase 1** — 인증 기본기 (login / signup / logout, D1, argon2id, 세션 쿠키)
- [x] **Phase 1.5** — 이메일 인증, 비밀번호 재설정, /auth/me, KV 레이트리밋
- [x] **Phase 2 (Worker 측)** — SSO 헤더 브릿지 (HMAC 서명 + splat 라우트 프록시)
- [ ] **Phase 2.5 (open-webui 측)** — fork 의 FastAPI HMAC verify 미들웨어 (webui 브랜치)
- [ ] **Phase 3** — MFA (TOTP)
- [ ] **Phase 4** — OAuth (Google / Kakao)
- [ ] **Phase 5** — 법령 RAG 파이프라인 고도화, 시나리오 템플릿

---

## 📚 Docs

| 문서 | 내용 |
|---|---|
| [docs/lawyalty/00-architecture.md](./docs/lawyalty/00-architecture.md) | 시스템 구성, 책임 분리, 권한 매트릭스, Phase |
| [docs/lawyalty/01-auth.md](./docs/lawyalty/01-auth.md) | D1 스키마, 세션, SSO 브릿지, 위협 모델, API |
| [docs/lawyalty/02-auth-ui.md](./docs/lawyalty/02-auth-ui.md) | 인증 화면 9종 설계 + 카피 + 접근성 |
| [design-systems/DESIGN.md](./design-systems/DESIGN.md) | 시그니처 컬러, 리퀴드 글래스 토큰 |

---

## ⚠️ Disclaimer

라윌티의 답변은 **법률 참고 자료** 이며 변호사의 공식 자문을 대체하지 않습니다. 구체적인 사건·분쟁·계약은 반드시 **자격 있는 변호사** 또는 **법무사** 와 상담하시기 바랍니다.

---

## 🤝 Contributing

비공개 초기 단계지만 피드백·기여 환영합니다.

1. 이슈로 논의 시작
2. Fork → Branch (`feat/your-feature`) → PR
3. 커밋: [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 License

- 라윌티 자체 코드: TBD
- `webui` 브랜치 (open-webui 기반): [BSD-3-Clause + 브랜딩 조항(§4)](https://github.com/open-webui/open-webui/blob/main/LICENSE)

---

## 📮 Contact

- Maintainer: [@nicarinai](https://github.com/nicarinai)
- Repository: [github.com/nicarinai/lawyalty](https://github.com/nicarinai/lawyalty)
