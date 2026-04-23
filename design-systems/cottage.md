# Design System: Cottage

> Notion과 Linear의 온기 있는 버전에서 영감을 받은 *따뜻한 에디토리얼 프로덕트* 감성.
> 크림 페이퍼 + 소프트 애프리콧 액센트. 오래 머물고 싶은 북노트 같은 인터페이스.
> 다크/라이트 듀얼 테마. 기본 라디우스는 `14px` — 둥글고 친근하게.

## 1. Visual Theme & Atmosphere

Cottage는 "신뢰할 수 있는데 따뜻한" 제품이 되고 싶은 곳을 위한 시스템이다. 전형적인 푸른 SaaS 팔레트를 버리고, **크림 페이퍼(`#fbf7ee`)**와 **웜 차콜(`#1a1814`)**을 두 테마의 기준점으로 삼는다. 두 색 모두 완전한 흰색·검정이 아니라 살짝 노란 언더톤이 돌아서, 종이 위에 인쇄된 잡지처럼 눈에 편하다.

액센트는 **소프트 애프리콧(`#f97f51`)**과 **모스 그린(`#4d7c5b`)**의 2-액센트 체계. 애프리콧은 따뜻한 상호작용(CTA, 호버, 링크 이모지)에, 모스 그린은 성공 상태와 차분한 구분선에. 포인트 컬러가 두 개라 "놀라운데 소란스럽지 않은" 분위기가 만들어진다.

타이포는 **Inter**(UI·본문)와 **Instrument Serif**(디스플레이·인용) 조합. 본문은 산세리프로 명료하게, 히어로와 섹션 도입부는 세리프로 잡지 오프닝처럼 사용한다. 이 2-패밀리 조합이 Cottage의 "책 같은" 질감을 책임진다.

디테일은 전부 "살짝 둥글게, 살짝 불규칙하게". 카드 라디우스는 `16px`, 아이콘은 둥근 획(stroke)으로, 구분선은 점선(dashed) 또는 2px 실선으로 변주된다. 일러스트는 손그림 느낌의 가느다란 1.5px 라인에 스팟 컬러(애프리콧)가 한 번씩 찍히는 스타일. PostHog의 고슴도치처럼, Cottage에도 *한 두 마리의 시그니처 마스코트*를 둘 자리가 있다.

**Key Characteristics**
- 크림 페이퍼 `#fbf7ee` / 웜 차콜 `#1a1814` — 절대 순백·순흑 금지
- 2-액센트 시스템: 애프리콧 `#f97f51`(상호작용) + 모스 그린 `#4d7c5b`(성공·중립 강조)
- Inter(UI·본문) + Instrument Serif(디스플레이) 이중 패밀리
- 기본 라디우스 `14px`, 카드 `16px`, 모달 `24px` — 전반적으로 푹신한 감각
- 손그림 라인 일러스트와 스팟 컬러 강조
- 다크 테마도 "따뜻한 밤"의 느낌 — 블루 기반 다크 테마와 명확히 구분
- 본문 line-height 1.65 — 에디토리얼급 읽기 편안함

## 2. Color Palette & Roles

### Brand Accents
| Token | Value | Role |
|-------|-------|------|
| `accent.apricot` | `#f97f51` | 주요 상호작용, 호버 텍스트, 링크 언더라인 |
| `accent.apricot-soft` | `#fbc7ad` | 배지 배경, 하이라이트 박스 |
| `accent.moss` | `#4d7c5b` | 성공·차분한 강조, 태그 |
| `accent.moss-soft` | `#c6d9cc` | 성공 배지 배경 |
| `accent.butter` | `#f5d16a` | 주의·노트 강조 (sparingly) |

### Light Theme Surfaces
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#fbf7ee` | 페이지 배경(크림 페이퍼) |
| `surface.card` | `#fffcf5` | 카드·패널 |
| `surface.raised` | `#ffffff` | 모달·팝오버(가장 밝음) |
| `surface.muted` | `#f1ecdf` | 인풋·서브 패널 |
| `surface.highlight` | `#fef3e8` | 애프리콧 하이라이트 박스 |

### Dark Theme Surfaces
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#1a1814` | 페이지 배경(웜 차콜) |
| `surface.card` | `#242019` | 카드·패널 |
| `surface.raised` | `#2d2821` | 모달·팝오버 |
| `surface.muted` | `#332d24` | 인풋·서브 패널 |
| `surface.highlight` | `#3a2a1f` | 애프리콧 하이라이트 박스 |

### Text
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `text.primary` | `#1a1814` | `#f5ede0` | 본문·헤딩 |
| `text.secondary` | `#575048` | `#bcb4a5` | 서브텍스트 |
| `text.muted` | `#8a8175` | `#8a8175` | 캡션·플레이스홀더 |
| `text.inverse` | `#fbf7ee` | `#1a1814` | 반전 버튼 위 텍스트 |
| `text.link` | `#c65a2e` | `#f97f51` | 링크(라이트에서는 애프리콧을 약간 톤다운) |

### Borders
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `border.subtle` | `#ebe3cf` | `#3a342a` | 기본 카드 |
| `border.default` | `#d9cfb8` | `#4a4339` | 구분선 |
| `border.strong` | `#b8a882` | `#6b5f4e` | 강조 보더 |
| `border.accent` | `#f97f51` | `#f97f51` | 포커스·액티브 |

### Semantic
| Token | Value (Light/Dark) | Role |
|-------|---------------------|------|
| `success` | `#4d7c5b` / `#7ea889` | 성공 |
| `warning` | `#d4a017` / `#f5d16a` | 주의 |
| `danger` | `#c84b3e` / `#e67062` | 오류 |
| `info` | `#5a7ca8` / `#8fb1d4` | 안내 |

## 3. Typography Rules

### Font Stack
- **Sans**: `"Inter", "Inter Variable", -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif`
- **Serif (Display)**: `"Instrument Serif", "Source Serif Pro", Georgia, "Times New Roman", serif`
- **Mono**: `"JetBrains Mono", "Fira Code", ui-monospace, Menlo, monospace`

### Hierarchy

| Role | Family | Size | Weight | Line Height | Tracking | Style |
|------|--------|------|--------|-------------|----------|-------|
| Display Hero | Instrument Serif | 72px | 400 | 1.05 | -1.5px | 이탤릭 혼용 가능 |
| Display L | Instrument Serif | 56px | 400 | 1.10 | -1.0px | 섹션 오프닝 |
| H1 | Inter | 36px | 700 | 1.20 | -0.6px | 페이지 타이틀 |
| H2 | Inter | 28px | 650 | 1.25 | -0.3px | 섹션 |
| H3 | Inter | 22px | 600 | 1.35 | -0.1px | 서브섹션·카드 |
| H4 | Inter | 18px | 600 | 1.40 | 0px | 카드 타이틀 |
| Pull Quote | Instrument Serif | 24px | 400 | 1.45 | 0px | 이탤릭, 블록쿼트 |
| Body L | Inter | 18px | 400 | 1.65 | 0px | 도입부 본문 |
| Body | Inter | 16px | 400 | 1.65 | 0px | 기본 본문 |
| Body S | Inter | 14px | 400 | 1.60 | 0px | 보조 본문·카드 |
| UI / Nav | Inter | 15px | 550 | 1.40 | 0px | UI·네비 |
| Button | Inter | 15px | 600 | 1.30 | 0.1px | 버튼 라벨 |
| Caption | Inter | 13px | 500 | 1.45 | 0.2px | 메타 |
| Label Uppercase | Inter | 12px | 650 | 1.20 | 1.4px | 카테고리 라벨, 대문자 |
| Mono Small | JetBrains Mono | 13px | 500 | 1.50 | 0px | 인라인 코드 |

### Principles
- **세리프는 오프닝에만**: Instrument Serif는 히어로, 섹션 헤더 1개, 또는 풀 쿼트에만. 본문 세리프는 피한다 (모바일 가독성 저하)
- **1.65 바디 라인하이트**: 읽기 쾌적성이 Cottage의 생명. 타이트하게 만들지 마라
- **이탤릭 세리프 혼용**: "강조 단어"만 이탤릭 세리프로 쳐서 에디토리얼 감 강조 — 단, 페이지당 2~3곳 이내
- **Weight 스텝**: Inter는 550, 600, 650의 *반단계* 활용이 핵심 — 700은 너무 무겁게 보인다
- **소문자 버튼**도 허용됨 — "Get started"보다 "get started"가 더 Cottage답다 (선택적)

## 4. Component Stylings

### Buttons

**Primary**
- 라이트: `background: #1a1814`, `color: #fbf7ee`
- 다크: `background: #fbf7ee`, `color: #1a1814`
- Radius: `12px`, Padding: `12px 20px`, Font: 15px / 600
- Hover: 배경이 애프리콧 `#f97f51`로 전환(200ms ease) — PostHog "호버 오렌지 플래시"의 Cottage 버전
- Active: `opacity: 0.92` + `transform: scale(0.98)`
- Focus: `outline: 2px solid #f97f51; outline-offset: 3px;`

**Apricot Solid (강조)**
- Background: `#f97f51`, Text: `#fffcf5`
- Radius: `12px`, 동일 패딩/폰트
- Hover: 밝기 +5% (`#fa8f65`) + 얕은 그림자
- 메인 히어로 CTA나 중요한 컨버전 포인트에 한정

**Secondary**
- 라이트: `background: #fffcf5`, `border: 1.5px solid #d9cfb8`, `color: #1a1814`
- 다크: `background: #242019`, `border: 1.5px solid #4a4339`, `color: #f5ede0`
- Radius: `12px`, Padding: `12px 20px`
- Hover: 보더 `border.strong`, 배경 `surface.muted`로 톤다운

**Ghost / Link**
- 배경 투명, 텍스트 `text.secondary`
- Hover: 텍스트 `accent.apricot` + 2px 애프리콧 언더라인 등장

### Cards

**Paper Card (기본)**
- Background: `surface.card`
- Border: `1px solid border.subtle`
- Radius: `16px`
- Padding: `24px 28px`
- Hover: 보더 `border.default`, `transform: translateY(-2px)`, shadow Level 2

**Highlight Card (스팟 컬러)**
- Background: `surface.highlight` (크림 위 연한 애프리콧)
- Border: `1.5px solid #fbc7ad` (라이트) / `#6b4a35` (다크)
- Radius: `16px`
- 노트·팁·인용구 박스에 사용

**Dashed Card (가벼운 구획)**
- Background: 투명
- Border: `1.5px dashed border.default`
- Radius: `16px`
- "아직 비어있음", "드래그 앤 드롭 존" 같은 소프트한 용도

**Shadow Card (떠 있는 요소)**
- Background: `surface.raised`
- Shadow: `0 20px 40px -16px rgba(26,24,20,0.18)` (라이트) / `0 20px 40px -16px rgba(0,0,0,0.6)` (다크)
- Radius: `20px`

### Inputs & Forms
- 배경: 라이트 `#fffcf5`, 다크 `surface.muted`
- Border: `1.5px solid border.default` (1.5px가 Cottage의 따뜻한 굵기감)
- Radius: `12px`, Padding: `12px 16px`
- Placeholder: `text.muted`, 이탤릭 가능
- Focus: 보더 `accent.apricot` + `0 0 0 4px rgba(249,127,81,0.15)` 링
- Error: 보더 `danger` + 동일 링 형태, 에러 메시지는 본문 아래 13px 세리프 이탤릭도 좋음

### Navigation
- **Top Nav**: 높이 `68px`, 배경 `surface.page` + 하단 `1px border.subtle`
- 가운데 로고 / 좌측 메뉴 / 우측 CTA 구조 가능 (editorial 감각)
- 링크 15px / 550, 색상 `text.secondary`, 호버 시 `accent.apricot`
- Active 링크는 하단 2px 애프리콧 대시(`-`) 2개로 장식 — "책 페이지 번호" 뉘앙스
- **Mobile**: 햄버거 → 크림 배경 풀 스크린 메뉴, 링크는 24px 세리프 리스트

### Badge / Tag
- Radius: `9999px` (pill)
- Padding: `3px 10px`, font 12px / 600
- Apricot: 배경 `accent.apricot-soft`, 텍스트 `#a34b23`
- Moss: 배경 `accent.moss-soft`, 텍스트 `#2d5939`
- Neutral: 배경 `surface.muted`, 텍스트 `text.secondary`

### Pull Quote / Callout
- 좌측 4px 애프리콧 실선 보더
- 배경 `surface.highlight`
- Radius: 우측만 `16px` (좌측은 플랫) — "페이지 안쪽에서 튀어나온" 느낌
- 폰트 Instrument Serif 20px 이탤릭

### Illustration & Icon Treatment
- 아이콘은 **1.5px stroke, 둥근 linecap/join** — Lucide의 기본값이 잘 맞는다
- 일러스트는 크림 배경 위 웜 차콜 라인 + 애프리콧 스팟 컬러 1~2 터치
- 마스코트·캐릭터는 손그림 느낌(약간의 선 흔들림)이 가장 Cottage답다

## 5. Layout Principles

### Spacing System (8pt 기반)
- Scale: `2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128`
- 섹션 간 수직: 데스크톱 `96–128px`, 모바일 `72–96px`
- 카드 내부: 패딩 `24–28px`, 요소 간 `16px`
- 에디토리얼 감을 위해 **좌우 여백을 충분히** — 본문 max-width `680px` 원칙

### Grid & Container
- **Max width**: 본문 `680px`, 피처/카드 `1120px`, 히어로/와이드 `1360px`
- **Gutter**: 데스크톱 `32px`, 모바일 `20px`
- **비대칭 레이아웃 허용**: 편집 잡지처럼 "2:1 + 여백" 배치 자주 사용

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `radius.xs` | `6px` | 인라인 태그 |
| `radius.sm` | `10px` | 작은 컨트롤, 토글 |
| `radius.md` | `12px` | 버튼·인풋(기본) |
| `radius.lg` | `14px` | 보조 컨테이너 |
| `radius.xl` | `16px` | 카드 (**기본 카드 라디우스**) |
| `radius.2xl` | `20px` | 큰 패널·섀도우 카드 |
| `radius.3xl` | `24px` | 모달·다이얼로그 |
| `radius.pill` | `9999px` | 배지·아바타 |

> Horizon(12px 기준)보다 Cottage(14px 기준)가 더 푹신한 감각. 카드는 `16px`가 기준선.

## 6. Depth & Elevation

### Elevation Scale

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| 0 | none | none | 페이지 캔버스 |
| 1 | `0 1px 2px rgba(26,24,20,0.04), 0 1px 0 rgba(26,24,20,0.06)` | `0 1px 0 rgba(255,255,255,0.03) inset` | 기본 카드 |
| 2 | `0 6px 20px -4px rgba(26,24,20,0.08)` | `0 6px 20px -4px rgba(0,0,0,0.4)` | 호버 리프트 |
| 3 | `0 14px 32px -12px rgba(26,24,20,0.15)` | `0 14px 32px -12px rgba(0,0,0,0.6)` | 드롭다운 |
| 4 | `0 28px 56px -20px rgba(26,24,20,0.25)` | `0 28px 56px -20px rgba(0,0,0,0.75)` | 모달 |

### Depth Philosophy
- **종이 쌓임**의 은유: 그림자는 *부드럽고 넓게* 퍼진다. 샤프한 드롭 섀도우 금지
- 그림자 색상에 *약간의 웜 톤* 섞기 — 순수한 `rgba(0,0,0,...)`보다 `rgba(26,24,20,...)`(차콜 베이스)가 팔레트와 조화
- 보더 굵기 `1.5px`를 적극 활용 — 1px은 약하고 2px는 무겁다, 1.5px가 Cottage의 골든 굵기

## 7. Do's and Don'ts

### Do
- 본문 line-height를 `1.65`로 유지 — 긴 글을 읽는 제품이라면 더더욱
- Instrument Serif는 *1 섹션에 1번*, 오프닝 또는 풀 쿼트에만
- 애프리콧을 *호버·링크·주요 CTA*에 집중 — 페이지 전체에 흩뿌리지 말 것
- 아이콘은 전부 라운드 linecap 1.5px stroke로 통일
- 다크 테마에서도 배경을 *웜 차콜*로 — 블루 계열 다크가 되지 않게
- 페이지당 1번 정도 *손그림 일러스트 또는 마스코트* 배치

### Don't
- 크림 대신 순백(`#ffffff`)을 페이지 배경으로 쓰지 마라 — Cottage의 정체성이 무너진다
- 세리프 본문 금지 — 모바일 가독성과 UI 일관성이 깨진다
- 라디우스를 `8px` 이하로 쓰지 마라 — 공격적으로 느껴진다
- 애프리콧과 모스 그린을 *동시에* 강조하지 마라 — 주인공은 애프리콧, 모스는 조연
- Drop shadow를 샤프하게 떨어뜨리지 마라 — 항상 blur ≥ 20px, 알파 ≤ 0.25
- 다크 테마를 블루/그레이 기반으로 만들지 마라 — "따뜻한 밤"의 감각을 잃는다
- 1px 보더와 2px 보더 혼용 금지 — 항상 1.5px 기준 

## 8. Responsive Behavior

### Breakpoints
| Name | Min Width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1440px |

### Scaling Rules
- 디스플레이 세리프: `clamp(40px, 4.5vw + 16px, 72px)` — 모바일에서 40px 이하로 떨어지지 않게
- 본문 `max-width: 68ch` 유지 — 폭 말고 *글자 수*로 제한
- 카드 3열 → 2열(md) → 1열(sm) 순으로 축소
- 풀 쿼트는 모바일에서 좌측 보더를 상단 보더로 회전(4px 상단 애프리콧 실선)

## 9. Agent Prompt Guide

### Quick Color Reference

**Light Theme**
- 페이지: `#fbf7ee`
- 카드: `#fffcf5`
- 텍스트 기본: `#1a1814`
- 텍스트 서브: `#575048`
- 보더: `#ebe3cf` ~ `#d9cfb8`
- 애프리콧 액센트: `#f97f51`
- 모스 액센트: `#4d7c5b`

**Dark Theme**
- 페이지: `#1a1814`
- 카드: `#242019`
- 텍스트 기본: `#f5ede0`
- 텍스트 서브: `#bcb4a5`
- 보더: `#3a342a` ~ `#4a4339`
- 애프리콧 액센트: `#f97f51` (동일)
- 모스 액센트: `#7ea889`

### Example Component Prompts

- "Cottage 히어로: 배경 `#fbf7ee`. Instrument Serif 72px weight 400 line-height 1.05, 중간에 '*exceptional*' 한 단어만 이탤릭. 서브텍스트는 Inter 18px weight 400 line-height 1.65 `#575048`. 메인 CTA는 Primary 버튼(다크 배경 `#1a1814`, 호버 시 `#f97f51`로 전환), 라디우스 12px."
- "Cottage 아티클 카드 그리드 2열. 각 카드 배경 `#fffcf5`, 보더 1.5px `#ebe3cf`, 라디우스 16px, 패딩 24px 28px. 상단 12px Inter 대문자 카테고리 라벨 weight 650 tracking 1.4px. 제목 H3 22px weight 600. 본문 14px Inter line-height 1.60 `#575048`. 호버 시 translateY(-2px) + 얕은 섀도우."
- "Cottage 풀 쿼트 블록: 배경 `#fef3e8`, 좌측 4px 애프리콧 `#f97f51` 실선 보더, 우측만 16px 라디우스. Instrument Serif 24px 이탤릭 weight 400 line-height 1.45. 하단에 인용자 이름 13px Inter weight 500."
- "Cottage 인풋 그룹: 라벨 13px Inter weight 500 `#575048`. 인풋 배경 `#fffcf5`, 보더 1.5px `#d9cfb8`, 라디우스 12px, 패딩 12px 16px. 포커스 시 보더 `#f97f51` + 4px `rgba(249,127,81,0.15)` 링."
- "Cottage 내비: 높이 68px, 배경 `#fbf7ee`, 하단 1px `#ebe3cf` 보더. 링크 15px weight 550 `#575048`, 호버 `#f97f51`. Active 링크 하단에 2px 애프리콧 대시 2개(`- -`) 장식. 우측 CTA Primary 버튼."

### Iteration Checklist
1. 페이지 배경이 크림/웜 차콜인가? (순백·순흑 아님)
2. 본문 line-height가 1.60 이상인가?
3. 애프리콧이 *상호작용*에 집중되고, 배경 장식으로 남용되지 않았는가?
4. Instrument Serif가 섹션당 1곳 이내로 쓰였는가?
5. 보더 굵기가 1.5px로 통일되었는가?
6. 아이콘 스트로크가 전부 라운드 캡 1.5px인가?
7. 다크 테마가 "따뜻한 밤"으로 보이는가? (블루 다크가 아닌가?)
