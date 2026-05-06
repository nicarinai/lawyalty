# 라윌티 설계 문서

> Cloudflare 프론트 + 홈서버 open-webui + D1 인증 베이스 시스템.
> 2026-05-05 시작.

## 문서 목록

| # | 문서 | 내용 |
|---|---|---|
| 00 | [Architecture](./00-architecture.md) | 시스템 구성, 책임 분리, 권한 매트릭스, Phase 진행 |
| 01 | [Auth System](./01-auth.md) | D1 스키마, 세션, SSO 헤더 브릿지, 위협 모델, API |
| 02 | [Auth UI](./02-auth-ui.md) | 로그인·가입·인증·MFA 화면 설계 + 카피 + 접근성 |

## 다음 단계 (구현 순서 요약)

1. SvelteKit + Cloudflare adapter 프로젝트 셋업 (라윌티 프론트 분리할지 / 같은 코드베이스에 라우트 얹을지 결정)
2. D1 마이그레이션 (`migrations/001_init.sql`) 작성 + 적용
3. 라윌티 디자인 시스템 (잉크 + 리퀴드 글래스) 이식
4. 인증 화면 9개 구현 (`02-auth-ui.md` § 15 순서)
5. SSO 헤더 브릿지 + 홈서버 HMAC verify middleware
6. 권한 매트릭스 enforcement
