# Design System: Prism

> Vercel과 Arc Browser의 대담함에서 영감을 받은 *고대비 모노크롬 + 원 포인트 비비드* 감성.
> 순도 높은 흑/백 위에 한 번씩 등장하는 비비드 틸(teal) 스팟 컬러. 개발자 도구의 날카로움을 유지하면서도 따뜻하고 캐주얼한 순간을 남긴다.
> 다크/라이트 듀얼 테마. 기본 라디우스는 `10px` — 단단하지만 기능적으로 부드럽게.

## 1. Visual Theme & Atmosphere

Prism은 "신뢰할 수 있는 기술 제품인데, 차가워 보이기는 싫은" 팀을 위한 시스템이다. 뼈대는 고대비 모노크롬이다. 라이트 테마의 배경은 **스노우(`#fafafa`)** — 순백을 피해 아주 살짝 회색이 섞인 차분한 흰색. 다크 테마는 **잉크(`#050507`)** — 완전한 검정에 미세한 블루-블랙 언더톤을 얹어서 모니터에서 "비어 있는 검정"처럼 보이지 않게 한다.

브랜드 액센트는 단 하나: **비비드 틸 `#14b8a6`**. 블루도 퍼플도 오렌지도 아닌 틸은 "테크 레퍼런스가 겹치지 않는" 희소한 선택이다. 이 틸은 페이지 대부분에서 *숨어 있다가*, CTA, 포커스 링, 링크 호버, 한 두 개의 핵심 아이콘에만 등장해서 강한 기억에 남는다.

타이포 골조는 **Geist Sans**(UI·본문) + **Geist Mono**(메타·코드). Prism의 개성은 *모노를 UI 요소로 끌어올리는 데* 있다. 섹션 카운터(`01 / 04`), 버전 라벨(`v2.1.0`), 타임스탬프, 데이터 숫자 — 이런 "정밀한 사실들"은 전부 Geist Mono로 처리해서 "우리는 데이터를 다루는 팀이다"라는 감각을 조용히 전달한다.

디테일의 특징은 **샤프한 그리드 + 둥근 인터랙션 요소**의 대비다. 페이지 구성은 엄격한 12 컬럼 그리드, 카드는 사각형 인식이 남아있는 `10–14px` 라디우스, 하지만 버튼과 배지는 `9999px` 풀 필(pill)로 둥글게 가서 "딱딱해 보이는 격자 안에서 만지고 싶은 요소만 부드럽게" 구분한다.

**Key Characteristics**
- 모노크롬 베이스 (스노우 `#fafafa` / 잉크 `#050507`) + 단일 액센트 틸 `#14b8a6`
- Geist Sans + Geist Mono 콤보, Mono를 *UI 메타 라벨*에 적극 활용
- 기본 라디우스 `10px`, 버튼/배지는 `9999px`(pill)로 대비
- 1px 정확한 보더 + 0.5px 해어라인 디바이더
- 섀도우 거의 없음, 깊이는 *대비*와 보더로
- 포커스 링은 틸 2px + 3px 오프셋 — 접근성 + 브랜드 시그니처
- 마이크로 인터랙션 필수: 200ms ease-out, 호버 시 `transform: translateY(-1px)` 기본값

## 2. Color Palette & Roles

### Brand
| Token | Value | Role |
|-------|-------|------|
| `brand.teal` | `#14b8a6` | 주요 브랜드·링크 호버·포커스 |
| `brand.teal-soft` | `#5eead4` | 다크 테마 호버·다이어그램 강조 |
| `brand.teal-dark` | `#0d9488` | 라이트 테마 액티브·눌린 상태 |

### Light Theme (Snow)
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#fafafa` | 페이지 배경(스노우) |
| `surface.card` | `#ffffff` | 카드·패널 |
| `surface.muted` | `#f4f4f5` | 서브 패널, 인풋 |
| `surface.sunken` | `#ebebeb` | 코드블록·디바이더 존 |
| `surface.inverse` | `#050507` | 반전 섹션(다크 밴드) |

### Dark Theme (Ink)
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#050507` | 페이지 배경(잉크) |
| `surface.card` | `#0e0e11` | 카드·패널 |
| `surface.muted` | `#17171b` | 서브 패널, 인풋 |
| `surface.sunken` | `#000000` | 코드블록·디바이더 존(더 깊은 검정) |
| `surface.inverse` | `#fafafa` | 반전 섹션(라이트 밴드) |

### Text
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `text.primary` | `#050507` | `#fafafa` | 본문·헤딩 |
| `text.secondary` | `#52525b` | `#a1a1aa` | 서브텍스트 |
| `text.muted` | `#71717a` | `#71717a` | 캡션·플레이스홀더 |
| `text.inverse` | `#fafafa` | `#050507` | 반전 버튼 위 텍스트 |
| `text.link` | `#050507` | `#fafafa` | 기본 링크(언더라인) |
| `text.link-hover` | `#14b8a6` | `#5eead4` | 링크 호버 — 브랜드 시그니처 플래시 |

### Borders
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `border.hairline` | `rgba(5,5,7,0.06)` | `rgba(250,250,250,0.06)` | 0.5px 구분선 |
| `border.subtle` | `#e4e4e7` | `#27272a` | 기본 카드 |
| `border.default` | `#d4d4d8` | `#3f3f46` | 구분선 |
| `border.strong` | `#a1a1aa` | `#52525b` | 강조 보더 |
| `border.focus` | `#14b8a6` | `#5eead4` | 포커스 링 |

### Semantic
| Token | Light / Dark | Role |
|-------|--------------|------|
| `success` | `#16a34a` / `#22c55e` | 성공 |
| `warning` | `#d97706` / `#f59e0b` | 주의 |
| `danger` | `#dc2626` / `#ef4444` | 오류 |
| `info` | `#2563eb` / `#3b82f6` | 안내 |

## 3. Typography Rules

### Font Stack
- **Sans**: `"Geist Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Mono**: `"Geist Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace`

### Hierarchy

| Role | Family | Size | Weight | Line Height | Tracking | Notes |
|------|--------|------|--------|-------------|----------|-------|
| Display XL | Geist Sans | 80px | 700 | 0.95 | -2.0px | 히어로 원라이너 |
| Display L | Geist Sans | 56px | 700 | 1.00 | -1.4px | 히어로 일반 |
| Display M | Geist Sans | 40px | 700 | 1.08 | -1.0px | 섹션 오프닝 |
| H1 | Geist Sans | 32px | 650 | 1.15 | -0.6px | 페이지 타이틀 |
| H2 | Geist Sans | 24px | 650 | 1.25 | -0.3px | 섹션 |
| H3 | Geist Sans | 18px | 600 | 1.35 | 0px | 카드 타이틀 |
| Body L | Geist Sans | 17px | 400 | 1.55 | 0px | 히어로 서브텍스트 |
| Body | Geist Sans | 15px | 400 | 1.55 | 0px | 기본 본문 |
| Body S | Geist Sans | 13px | 400 | 1.50 | 0px | 보조 본문 |
| UI / Nav | Geist Sans | 14px | 500 | 1.40 | 0px | UI·네비 |
| Button | Geist Sans | 14px | 550 | 1.30 | 0.1px | 버튼 라벨 |
| Caption | Geist Sans | 12px | 500 | 1.40 | 0.2px | 캡션 |
| Mono L | Geist Mono | 15px | 500 | 1.55 | 0px | 코드 블록 |
| Mono | Geist Mono | 13px | 500 | 1.50 | 0px | 인라인 코드 |
| Mono Meta | Geist Mono | 12px | 500 | 1.40 | 0.5px | 버전·섹션 카운터·타임스탬프 |
| Mono Caps | Geist Mono | 11px | 550 | 1.30 | 1.5px | 대문자 라벨 (`SECTION 01`) |

### Principles
- **Display는 네거티브 트래킹 필수**: 80px에서 -2px까지 당겨야 응축된 테크 감성이 나온다
- **Mono를 "사실 층위"로 사용**: 의견과 설명은 Sans, 버전·카운트·타임스탬프·키 조합은 Mono. 이 분리가 Prism의 개성
- **굵은 본문 금지**: Prism은 헤딩만 굵고(650–700) 본문은 400 유지. 위계가 대비로 명확해진다
- **언더라인 링크**: 모든 링크는 기본 1px 언더라인, 호버 시 틸로 전환 + 언더라인 굵어짐(2px)
- **Section counter 관습**: 섹션 상단에 `01 / 04` 형태의 Mono 카운터를 두면 Prism다워진다

## 4. Component Stylings

### Buttons

**Primary (Pill Invert)**
- 라이트: `background: #050507`, `color: #fafafa`
- 다크: `background: #fafafa`, `color: #050507`
- Radius: `9999px` (풀 필), Padding: `10px 18px`, Font: 14px / 550
- Hover: `background: #14b8a6` (틸로 완전 전환) + `color: #050507`/`#fafafa` 적절히 조정
- Active: `transform: translateY(1px)` + 틸 유지
- Focus: `outline: 2px solid #14b8a6; outline-offset: 3px;`

**Secondary (Outlined)**
- Background: transparent
- Border: `1px solid border.default`, text: `text.primary`
- Radius: `9999px`, 동일 패딩/폰트
- Hover: border `text.primary`, 배경 `surface.muted`
- 다크/라이트 모두 동일 스타일

**Ghost / Text**
- 배경 투명, 텍스트 `text.secondary`
- Radius: `8px` (고스트만 풀 필이 아니라 스퀘어드 필)
- Hover: 배경 `surface.muted`, 텍스트 `text.primary`
- 네비·인라인 액션용

**Icon Button**
- 정사각 `36×36` 또는 `32×32`, Radius `10px` (풀 필 아님 — 아이콘은 각진 영역이 더 정확해 보인다)
- 배경: 기본 transparent, 호버 `surface.muted`
- 포커스 시 틸 2px 아웃라인

**Destructive**
- 배경 `danger`, 텍스트 white, 동일 풀 필 형태
- 영구 삭제·탈퇴 같은 행동에만

### Cards

**Standard Card**
- Background: `surface.card`
- Border: `1px solid border.subtle`
- Radius: `12px`
- Padding: `20px`
- Hover(인터랙티브): 보더 `border.default`, translateY(-1px), shadow Level 2

**Bordered Feature Card**
- 동일 스타일이지만 상단에 `4px` 두께 틸 바가 얹히는 경우(카테고리 색상 구분용)
- Radius 상단: `12px`, 하단 카드 라디우스와 일치

**Split Card (이미지 + 텍스트)**
- 상단 이미지 영역: radius `12px 12px 0 0`, 배경 `surface.sunken`
- 하단 텍스트 영역: 패딩 `20px`
- 전체 Radius `12px`, 보더 `1px border.subtle`

**Inverse Card (강조 블록)**
- 라이트에서는 `surface.inverse` (검정) 카드, 다크에서는 `surface.inverse` (흰색) 카드로 반전
- 한 페이지에 하나의 강조 블록이 있을 때 사용 — 시선 끌림용

### Inputs & Forms
- 배경: 라이트 `#ffffff`, 다크 `surface.muted`
- Border: `1px solid border.default`
- Radius: `10px` (인풋은 풀 필 아님)
- Padding: `10px 14px`, Font: 14px / 450
- Placeholder: `text.muted`
- Focus: 보더 `border.focus` + `0 0 0 3px rgba(20,184,166,0.2)` 링
- 라벨은 입력 위 `Mono Caps` 스타일(`LABEL` 11px 대문자 tracking 1.5px)로 하면 Prism다워짐
- Error: 보더 `danger` + 13px 본문 에러 메시지

### Navigation
- **Top Nav**: 높이 `60px`, 배경 `surface.page/95` + `backdrop-filter: blur(12px)`, 하단 `1px border.hairline`
- **로고**: 모노크롬 심볼, 오직 호버 시만 틸로 플래시
- **Nav links**: 14px / 500, `text.secondary`, 호버 `text.primary`
- **Active 링크**: 하단 2px 틸 인디케이터
- **Right cluster**: 검색 아이콘 + GitHub 아이콘(해당된다면) + 테마 토글 + Primary Pill CTA
- **Mobile**: 햄버거 → 전체화면 블랙/화이트 반전 메뉴

### Badge / Tag
- Radius: `9999px` (pill), font 11px Mono weight 550 tracking 1.2px 대문자
- Neutral: 배경 `surface.muted`, 텍스트 `text.secondary`
- Brand: 배경 `rgba(20,184,166,0.12)`, 텍스트 `brand.teal-dark` (라이트) / `brand.teal-soft` (다크)
- 세맨틱 배지는 해당 색상 12% 알파 배경
- *Mono로 쓰면* 훨씬 Prism답다 (`v2.1`, `BETA`, `NEW`)

### Code Block
- 배경 `surface.sunken`
- Radius: `10px`
- Padding: `16px 18px`
- Font: Geist Mono 14px / 500 / line-height 1.55
- 우측 상단: Ghost 아이콘 버튼(copy)
- 필요하면 좌측에 1px `border.default` 수직 라인 + 라인 번호 (Mono 12px `text.muted`)

### Section Counter (Prism 시그니처)
- Mono Caps 스타일: `01 / 04`
- 섹션 시작 상단 좌측 또는 우측에 배치
- 색상 `text.muted`, 아래에 1px `border.subtle` 수평선

## 5. Layout Principles

### Spacing System (8pt + 4pt 보조)
- Scale: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160`
- 섹션 간 수직: 데스크톱 `120–160px`, 모바일 `80–96px`
- 카드 내부 패딩: `20–24px`
- 카드 간 gap: `16–20px`

### Grid & Container
- **Max width**: `1280px` (본문), `1440px` (히어로/데이터 대시보드)
- **엄격한 12 컬럼**: Prism은 그리드 정렬이 눈에 보이는 디자인. Gutter `24px`
- **비대칭 허용**: 히어로는 자주 `7:5` 또는 `8:4` 비율
- **Heavy use of thin dividers**: 섹션 사이에 0.5–1px `border.hairline` 구분선

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `radius.xs` | `4px` | 토큰·코드 하이라이트 |
| `radius.sm` | `8px` | 고스트 버튼·Icon 버튼 |
| `radius.md` | `10px` | 인풋·코드블록 (기본) |
| `radius.lg` | `12px` | 카드 (**기본 카드**) |
| `radius.xl` | `14px` | 큰 패널 |
| `radius.2xl` | `18px` | 모달 |
| `radius.pill` | `9999px` | 버튼·배지·태그 |

> Prism은 *컨테이너는 조금 덜 둥글게(10–14px), 인터랙티브 요소는 완전 필(9999px)* 로 대비를 준다.

## 6. Depth & Elevation

### Elevation Scale

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| 0 | none | none | 페이지 |
| 1 | `0 1px 2px rgba(0,0,0,0.05)` | `0 0 0 1px rgba(255,255,255,0.04) inset` | 카드 기본 |
| 2 | `0 4px 12px rgba(0,0,0,0.06)` | `0 4px 12px rgba(0,0,0,0.5)` | 호버 |
| 3 | `0 12px 24px -8px rgba(0,0,0,0.12)` | `0 12px 24px -8px rgba(0,0,0,0.7)` | 드롭다운 |
| 4 | `0 24px 48px -16px rgba(0,0,0,0.18)` | `0 24px 48px -16px rgba(0,0,0,0.8)` | 모달 |

### Depth Philosophy
- **그림자 최소화**: Prism의 깊이는 90%가 *보더와 대비*에서 온다. 섀도우는 확실히 떠 있는 것(모달·드롭다운)에만
- **0.5px 해어라인**: `border.hairline`을 섹션 구분선으로 적극 사용 — 얇고 정확한 줄이 테크 감성을 강화
- **다크에서 1px 인너 하이라이트**: 카드 상단에 `inset 0 1px 0 rgba(255,255,255,0.04)`만으로도 깊이감이 충분
- **그림자 색은 순흑**: Prism에서는 웜톤 그림자가 어울리지 않는다. 순수한 `rgba(0,0,0,...)`

## 7. Do's and Don'ts

### Do
- 페이지는 모노크롬, 틸은 *인터랙션에만*. 스틸 숏 상태에서는 거의 보이지 않아야 한다
- Mono 폰트를 메타 정보(버전·카운트·타임스탬프·대문자 라벨)에 적극 사용
- 버튼과 배지는 풀 필(`9999px`), 카드와 인풋은 스퀘어드 라운드(`10–14px`)로 대비
- 섹션 오프닝에 `01 / 04` 형태의 Mono 카운터 + 1px 해어라인 활용
- 라이트 테마는 스노우 `#fafafa`, 다크 테마는 잉크 `#050507` — 순백/순흑 피하기
- 마이크로 인터랙션(`translateY(-1px)` 호버, 200ms ease-out)을 인터랙티브 요소 전반에 통일
- 포커스 링은 항상 틸로 — 브랜드 시그니처이자 접근성 보장

### Don't
- 틸을 배경·보더 장식으로 쓰지 마라 — 주요 상호작용 순간에만 등장해야 한다
- 두 번째 액센트 컬러를 추가하지 마라 — 모노크롬 + 틸의 희소성이 Prism의 핵심
- 버튼에 `10–14px` 라운드를 쓰지 마라 — 풀 필과의 대비가 무너진다
- 섀도우를 카드 기본 상태에 쓰지 마라 — 보더만으로 경계를 만든다
- 본문 weight를 500 이상으로 올리지 마라 — Prism의 본문은 400 원칙
- 샘세리프 대문자 라벨을 쓰지 마라 — 대문자 라벨은 *Mono*가 Prism 스타일
- 그라디언트 사용 금지 — Prism은 플랫, 플랫, 플랫

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
- Display XL: `clamp(44px, 6vw + 16px, 80px)` — 모바일에서 44px까지 축소
- 섹션 패딩: `clamp(64px, 8vw, 160px)`
- 카드 그리드: 4열 → 3열(xl) → 2열(md) → 1열(sm)
- 섹션 카운터는 모바일에서 섹션 상단 좌측으로 단순 배치
- Inverse Card는 모바일에서 풀 브리드(100vw) 가능

## 9. Agent Prompt Guide

### Quick Color Reference

**Light Theme (Snow)**
- 페이지: `#fafafa`
- 카드: `#ffffff`
- 텍스트 기본: `#050507`
- 텍스트 서브: `#52525b`
- 보더: `#e4e4e7` ~ `#d4d4d8`
- 해어라인: `rgba(5,5,7,0.06)`
- 브랜드 틸: `#14b8a6`

**Dark Theme (Ink)**
- 페이지: `#050507`
- 카드: `#0e0e11`
- 텍스트 기본: `#fafafa`
- 텍스트 서브: `#a1a1aa`
- 보더: `#27272a` ~ `#3f3f46`
- 해어라인: `rgba(250,250,250,0.06)`
- 브랜드 틸: `#14b8a6` (동일, 또는 호버 `#5eead4`)

### Example Component Prompts

- "Prism 히어로 섹션. 배경 `#fafafa`(라이트)/`#050507`(다크). 상단 좌측에 Geist Mono 11px 대문자 `01 / 04` 섹션 카운터 + 하단 1px 해어라인. 아래 Geist Sans 80px weight 700 line-height 0.95 tracking -2px 헤드라인. 서브텍스트 17px weight 400 `#52525b`. Primary 풀 필 CTA (배경 `#050507`, 텍스트 `#fafafa`, radius 9999px, 호버 시 배경 `#14b8a6`). 세컨더리는 Outlined 풀 필."
- "Prism 피처 카드 3열 그리드. 카드 배경 `#ffffff`, 보더 1px `#e4e4e7`, 라디우스 12px, 패딩 20px. 상단에 Geist Mono 11px 대문자 tracking 1.5px 카테고리 태그 (배경 `rgba(20,184,166,0.12)`, 텍스트 `#0d9488`, radius 9999px). 제목 H3 18px weight 600. 본문 15px weight 400 line-height 1.55 `#52525b`. 호버 시 translateY(-1px) + 보더 진해짐."
- "Prism 내비게이션 높이 60px, 배경 `rgba(250,250,250,0.95)` + backdrop-filter blur 12px, 하단 1px 해어라인. 로고 모노크롬, 링크 14px weight 500 `#52525b`. Active 링크 하단 2px `#14b8a6` 인디케이터. 우측 Icon 버튼 클러스터 + Primary Pill CTA."
- "Prism 코드 블록: 배경 `surface.sunken` (라이트 `#ebebeb`/다크 `#000000`), radius 10px, 패딩 16px 18px. Geist Mono 14px weight 500 line-height 1.55. 우측 상단 Ghost 카피 버튼 (radius 8px). 좌측 1px `border.default` 수직선 + 라인 번호 Mono 12px `text.muted`."
- "Prism 인풋 그룹: 라벨은 입력 위 Geist Mono 11px 대문자 tracking 1.5px `text.secondary`. 인풋 배경 라이트 `#ffffff`/다크 `#17171b`, 보더 1px `border.default`, radius 10px, 패딩 10px 14px. 포커스 보더 `#14b8a6` + 3px `rgba(20,184,166,0.2)` 링."

### Iteration Checklist
1. 페이지 배경이 스노우/잉크인가? (순백·순흑 아님)
2. 틸이 *인터랙션에만* 등장하고, 페이지 전반이 모노크롬인가?
3. 버튼/배지는 풀 필, 카드/인풋은 10–14px 라운드로 *대비*가 되어 있는가?
4. Mono가 버전·카운트·타임스탬프·대문자 라벨에 사용되고 있는가?
5. 섀도우가 모달·드롭다운 외에는 최소화되어 있는가?
6. 포커스 링이 틸로 통일되어 있는가?
7. 0.5–1px 해어라인이 섹션 구분에 사용되는가?
