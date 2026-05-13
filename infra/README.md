# 라윌티 인프라 (로컬 dev)

홈서버 운영 컴포넌트 (postgres + open-webui) 를 로컬에서 OrbStack/Docker 로 띄웁니다.

## 처음 한 번

```bash
cp .env.example .env
# .env 의 빈 값 채우기:
#   WEBUI_SECRET_KEY=$(openssl rand -hex 32)
#   SSO_SECRET=$(openssl rand -hex 32)
# 동일한 SSO_SECRET 을 web/.dev.vars 에도 설정해야 게이트웨이 서명이 검증됩니다.
```

## 띄우기 / 종료

```bash
docker compose up -d        # 백그라운드 시작
docker compose ps           # 상태 확인
docker compose logs -f openwebui    # 로그 추적
docker compose down         # 중지 (데이터 보존)
docker compose down -v      # 볼륨까지 삭제 (초기화)
```

## 접속

| 컴포넌트 | 호스트 주소 | 비고 |
| --- | --- | --- |
| open-webui | http://localhost:8080 | dev 한정 직접 접속. 운영은 게이트웨이 (Worker) 통해서만 도달 가능해야 함. |
| postgres | localhost:5433 | 컨테이너 내부 5432 → 호스트 5433 매핑 (충돌 방지) |

## 인증 모드

open-webui 는 `WEBUI_AUTH_TRUSTED_EMAIL_HEADER` 모드로 동작합니다.

- 자체 가입/로그인 폼은 비활성 (`ENABLE_SIGNUP=false`, `ENABLE_LOGIN_FORM=false`).
- Cloudflare Worker 가 D1 세션을 검증한 뒤 `X-Forwarded-Email/User/Groups` + HMAC 서명을 주입해 프록시.
- HMAC 검증은 webui 브랜치의 fork 빌드에 미들웨어로 들어갑니다 (이번 phase 미포함, 운영 가기 전 필수).
