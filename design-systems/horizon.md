# Design System: Horizon

> Linear에서 영감을 받은 *깨끗하고 기민한 프로덕트 SaaS* 감성.
> 신뢰감 있는 딥 인디고 베이스 위에 아이리디센트 퍼플–블루 그라디언트가 언뜻 스치는 분위기.
> 다크/라이트 듀얼 테마. 기본 라디우스는 `12px`로 PostHog 레퍼런스보다 한 호흡 더 둥글게.

## 1. Visual Theme & Atmosphere

Horizon은 "믿을 수 있는 기술 제품이지만, 지루하지 않은 제품"을 지향한다. 배경은 완전한 흰색이나 검정이 아니라 약간의 블루 언더톤이 감도는 차가운 페이퍼 화이트(`#fbfbfd`)와 슬레이트 미드나이트(`#0b0d12`)다. 두 테마 모두 완전한 `#ffffff`/`#000000`을 피해서 "스크린이 너무 튀지 않는" 편안함을 유지한다.

브랜드 액센트는 일렉트릭 인디고(`#5b5bd6`) — 선명하지만 네온이 아니어서 장시간 봐도 피로하지 않다. 중요한 순간(히어로, 주요 CTA, 포커스 링)에만 아이리디센트 그라디언트(인디고 → 시안 → 바이올렛)가 얇게 스며든다. 기본 상태에서는 조용하고, 상호작용 순간에만 빛난다.

타이포는 **Geist Sans** + **Geist Mono**. 지오메트릭하면서도 휴머니스트 터치가 있어 "테크 같지만 딱딱하지 않은" 균형을 잡는다. 디스플레이는 대담한 weight 600~700에 살짝 네거티브 트래킹을 걸어 정돈된 인상을, 바디는 400~450 + 1.55 라인하이트로 여유로운 호흡을 유지한다.

Horizon의 포인트는 **"레이어로 깊이를 만든다"**이다. 그림자는 최소화하고, 대신 반투명 보더(`rgba(255,255,255,0.06)`–`rgba(11,13,18,0.08)`)와 얇은 톱-하이라이트(1px 내부 보더)로 프로덕트 UI 같은 정밀한 입체감을 연출한다.

**Key Characteristics**
- 아이리디센트 인디고→시안→바이올렛 그라디언트를 *히어로와 주요 인터랙션에만* 사용
- 완전한 흰색/검정을 피한 쿨 페이퍼 `#fbfbfd` / 미드나이트 `#0b0d12`
- Geist Sans(디스플레이/UI) + Geist Mono(코드·메타 라벨)
- 기본 라디우스 `12px`, 버튼은 `10px`, 카드는 `14–16px`, 모달은 `20px`
- 그림자보다 반투명 보더와 1px 인너 하이라이트로 깊이 표현
- 포커스 링은 브랜드 인디고 `#5b5bd6` 2px + 오프셋 2px — 접근성 + 브랜드 시그니처
- 다크 테마가 퍼스트 클래스. 라이트 테마도 동일한 컨트라스트로 매핑

## 2. Color Palette & Roles

### Brand
| Token | Value | Role |
|-------|-------|------|
| `brand.indigo` | `#5b5bd6` | 주요 브랜드 / 링크 / 포커스 링 |
| `brand.indigo-soft` | `#7c7cf0` | 호버, 세컨더리 링크 |
| `brand.violet` | `#8b5cf6` | 그라디언트 보조 포인트 |
| `brand.cyan` | `#22d3ee` | 그라디언트 하이라이트 |
| `brand.gradient` | `linear-gradient(135deg, #5b5bd6 0%, #22d3ee 55%, #8b5cf6 100%)` | 히어로·CTA 액센트 |

### Light Theme Surfaces
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#fbfbfd` | 페이지 배경(쿨 페이퍼) |
| `surface.card` | `#ffffff` | 카드·패널 |
| `surface.muted` | `#f2f3f7` | 서브 패널, 인풋 |
| `surface.sunken` | `#e8eaf0` | 코드블록·디바이더 존 |
| `surface.overlay` | `rgba(255, 255, 255, 0.82)` | 헤더 블러 배경 |

### Dark Theme Surfaces
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#0b0d12` | 페이지 배경(슬레이트 미드나이트) |
| `surface.card` | `#13151c` | 카드·패널 |
| `surface.muted` | `#1a1d26` | 서브 패널, 인풋 |
| `surface.sunken` | `#090a0e` | 코드블록·디바이더 존 |
| `surface.overlay` | `rgba(13, 15, 22, 0.72)` | 헤더 블러 배경 |

### Text
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `text.primary` | `#0f1115` | `#f2f3f7` | 본문·헤딩 |
| `text.secondary` | `#4a4f5c` | `#a8acb8` | 서브텍스트 |
| `text.muted` | `#6b7083` | `#70758a` | 캡션·플레이스홀더 |
| `text.inverse` | `#ffffff` | `#0b0d12` | 반전 상황(다크 버튼 위 텍스트) |
| `text.link` | `#5b5bd6` | `#9999f7` | 링크 |

### Borders & Dividers
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `border.subtle` | `rgba(11,13,18,0.06)` | `rgba(255,255,255,0.06)` | 기본 카드 보더 |
| `border.default` | `rgba(11,13,18,0.12)` | `rgba(255,255,255,0.10)` | 구분선 |
| `border.strong` | `rgba(11,13,18,0.24)` | `rgba(255,255,255,0.18)` | 강조 보더 |
| `border.focus` | `#5b5bd6` | `#7c7cf0` | 포커스 링 |

### Semantic
| Token | Value | Role |
|-------|-------|------|
| `success` | `#10b981` | 성공 |
| `warning` | `#f59e0b` | 주의 |
| `danger` | `#ef4444` | 오류·파괴적 행동 |
| `info` | `#3b82f6` | 안내 |

세맨틱 색상은 다크 테마에서 `opacity: 0.9` 또는 15% 밝게 대응되는 variant(`success.dark = #34d399` 등)로 조정한다.

## 3. Typography Rules

### Font Stack
- **Sans (본문·UI)**: `"Geist Sans", "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`
- **Display (선택)**: Geist Sans 700~800 — 별도 디스플레이 패밀리 없이 weight로 위계를 만든다
- **Mono**: `"Geist Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace`

### Hierarchy

| Role | Size | Weight | Line Height | Tracking | Use |
|------|------|--------|-------------|----------|-----|
| Display XL | 64px | 700 | 1.05 | -1.6px | 히어로 원라이너 |
| Display L | 48px | 700 | 1.10 | -1.2px | 히어로 일반 |
| H1 | 36px | 700 | 1.15 | -0.7px | 페이지 제목 |
| H2 | 28px | 700 | 1.25 | -0.4px | 섹션 |
| H3 | 22px | 650 | 1.30 | -0.2px | 서브섹션, 카드 타이틀 |
| H4 | 18px | 600 | 1.35 | 0px | 피처 제목 |
| Body L | 18px | 450 | 1.60 | 0px | 히어로 서브텍스트 |
| Body | 15px | 450 | 1.55 | 0px | 기본 본문 |
| Body S | 14px | 450 | 1.50 | 0px | 카드 본문 |
| UI / Nav | 14px | 550 | 1.40 | 0px | 네비·버튼·UI |
| Caption | 13px | 500 | 1.40 | 0.1px | 메타·배지 |
| Mono Small | 13px | 500 | 1.45 | 0px | 인라인 코드 |
| Label Uppercase | 11px | 600 | 1.30 | 1.2px | 카테고리 라벨, 대문자 |

### Principles
- 디스플레이는 *weight로 위계*, 사이즈는 점프를 크게. 중간 톤은 H3 하나로 충분히 처리된다
- 바디 weight은 Geist 특성상 `450`이 가장 자연스럽다 — 400은 살짝 가볍고, 500은 UI로 기울어진다
- 링크는 기본 `text.primary` + 하단 2px 인디고 언더라인. 호버에 언더라인이 컬러 채움으로 전환
- Mono는 코드뿐 아니라 "버전 번호", "키보드 쇼트컷", "타임스탬프" 같은 *정밀한 메타*에도 사용

## 4. Component Stylings

### Buttons

**Primary (Brand)**
- 라이트: `background: #0f1115`, `color: #ffffff`
- 다크: `background: #ffffff`, `color: #0b0d12`
- Radius: `10px`, Padding: `10px 16px`, Font: 14px / 550
- Hover: `opacity: 0.88` + `transform: translateY(-1px)`
- Active: `transform: translateY(0)` + `opacity: 0.95`
- Focus: `outline: 2px solid #5b5bd6; outline-offset: 2px;`

**Gradient CTA (히어로 전용)**
- Background: `brand.gradient` (135도 인디고→시안→바이올렛)
- Text: `#ffffff`, weight 600
- Radius: `12px`, Padding: `12px 20px`
- Hover: 그라디언트 각도를 `165deg`로 회전 + 얕은 글로우 `0 8px 24px rgba(91,91,214,0.35)`
- *페이지당 1개*만 사용 — 남용하면 시그니처가 무뎌진다

**Secondary**
- 라이트: `background: #ffffff`, `border: 1px solid rgba(11,13,18,0.12)`, `color: #0f1115`
- 다크: `background: #13151c`, `border: 1px solid rgba(255,255,255,0.10)`, `color: #f2f3f7`
- Radius: `10px`, Padding: `10px 16px`
- Hover: 보더가 `border.strong`으로 진해지고 배경이 `surface.muted`로

**Ghost / Text**
- 배경 투명, 텍스트 `text.secondary`
- Hover: 배경 `surface.muted`, 텍스트 `text.primary`
- 네비게이션·드롭다운 트리거·인라인 액션에 사용

**Destructive**
- 배경 `#ef4444`, 텍스트 `#ffffff`, 동일 라디우스
- 삭제·취소 같은 파괴적 액션에만

### Cards

**Standard Card**
- Background: `surface.card`
- Border: `1px solid border.subtle`
- Radius: `14px`
- Padding: `20px 24px`
- Hover(인터랙티브일 때): 보더가 `border.default`로, 아주 얕은 리프트 `translateY(-2px)` + `0 4px 16px rgba(11,13,18,0.06)` (다크에서는 `rgba(0,0,0,0.3)`)

**Feature Card (강조)**
- Background: `surface.card`
- Border: `1px solid transparent`, 배경에 gradient border 트릭 사용 가능 (`background: linear-gradient(card, card) padding-box, brand.gradient border-box`)
- Radius: `16px`
- 아이콘 영역은 `surface.sunken`으로 분리

**Glass Panel (모달·팝오버)**
- Background: `surface.overlay` (반투명)
- `backdrop-filter: blur(16px) saturate(140%)`
- Border: `1px solid border.subtle`
- Radius: `20px`
- Shadow: `0 24px 60px -20px rgba(11,13,18,0.25)` (다크에서는 `rgba(0,0,0,0.6)`)

### Inputs & Forms
- 배경: 라이트 `#ffffff`, 다크 `surface.muted`
- Border: `1px solid border.default`
- Radius: `10px`, Padding: `10px 14px`
- Placeholder: `text.muted`
- Focus: 보더 `border.focus` + `0 0 0 3px rgba(91,91,214,0.18)` 링
- Error: 보더 `danger` + 동일한 링 형태(빨강 18% 알파)
- Disabled: 배경 `surface.sunken`, 텍스트 `text.muted`, 커서 `not-allowed`

### Navigation
- **Top Nav**: 높이 `64px`, 배경 `surface.overlay` + `backdrop-filter: blur(14px)`, 하단 `1px border.subtle`
- **Nav links**: 14px / 550, 색상 `text.secondary`, 호버 시 `text.primary`
- **Active 링크**: 브랜드 인디고, 하단 2px 인디고 인디케이터
- **Mega menu**: Glass Panel 스타일 + 다단 컬럼
- **Mobile**: 햄버거 → 전체화면 슬라이드 인, 배경 `surface.page`

### Badge / Tag
- Radius: `9999px` (pill) 또는 `6px` (스퀘어 라벨)
- Padding: `2px 10px`, font 12px / 600
- 기본: 배경 `surface.muted`, 텍스트 `text.secondary`
- 세맨틱 배지는 해당 세맨틱 컬러의 10% 알파 배경 + 100% 알파 텍스트

### Code Block
- 배경 `surface.sunken`
- Radius: `12px`
- Padding: `14px 16px`
- Font: Geist Mono 13px / 500 / line-height 1.6
- 최상단 우측에 카피 버튼(Ghost 스타일)

## 5. Layout Principles

### Spacing System (8pt 기반, 4pt 보조)
- Scale: `2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`
- 섹션 간 수직 여백: 데스크톱 `96–128px`, 모바일 `64–80px`
- 카드 내부: 패딩 `20–24px`, 내부 요소 간 `12–16px`

### Grid & Container
- **Max width**: `1280px` (본문), `1440px` (히어로·쇼케이스)
- **Gutter**: 데스크톱 `32px`, 태블릿 `24px`, 모바일 `16px`
- **Column**: 12 컬럼 유연 그리드, 피처는 3열, 비교 테이블은 2–4열

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `radius.xs` | `6px` | 배지, 인라인 태그 |
| `radius.sm` | `8px` | 작은 컨트롤 |
| `radius.md` | `10px` | 버튼·인풋(기본) |
| `radius.lg` | `12px` | 기본 컨테이너 |
| `radius.xl` | `16px` | 카드·패널 |
| `radius.2xl` | `20px` | 모달·팝오버 |
| `radius.pill` | `9999px` | 필 배지·아바타 |

> PostHog가 4–6px로 단단한 느낌이었다면 Horizon은 10–16px 존에서 동작 — "조금 더 둥글게"의 기본 해석.

## 6. Depth & Elevation

### Elevation Scale

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| 0 | none | none | 페이지 캔버스 |
| 1 | `0 1px 0 rgba(11,13,18,0.04), 0 1px 2px rgba(11,13,18,0.06)` | `0 1px 0 rgba(255,255,255,0.04) inset` | 카드 기본 |
| 2 | `0 4px 16px rgba(11,13,18,0.06)` | `0 4px 16px rgba(0,0,0,0.35)` | 호버 리프트 |
| 3 | `0 12px 32px -8px rgba(11,13,18,0.12)` | `0 12px 32px -8px rgba(0,0,0,0.55)` | 드롭다운·토스트 |
| 4 | `0 24px 60px -20px rgba(11,13,18,0.25)` | `0 24px 60px -20px rgba(0,0,0,0.7)` | 모달·다이얼로그 |

### Depth Philosophy
- **1px 인너 하이라이트**가 Horizon의 시그니처. 카드 상단에 `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)` (다크)만으로도 "조명을 받은" 느낌이 난다
- 그림자는 항상 아래로 떨어진다(Y양수), 절대 사방에 퍼지지 않게
- 라이트 테마는 그림자가 얕고 가볍게, 다크 테마는 더 진하게 — 다크에서 얕은 그림자는 보이지 않기 때문

## 7. Do's and Don'ts

### Do
- 브랜드 그라디언트는 *페이지당 1~2곳*에만 — 히어로, 주요 CTA, 혹은 중요한 배지에 한정
- 다크/라이트 동일한 *구조*를 유지: 컴포넌트 구조는 같고 색 토큰만 스왑
- 라디우스는 `12px`를 기본값으로 두고, 요소 크기가 커질수록 한 단계씩 증가
- 텍스트 컨트라스트는 WCAG AA 이상 (`text.primary` on `surface.card` ≥ 4.5:1)
- 포커스 링은 *모든 인터랙티브 요소*에 브랜드 인디고로 통일 — 접근성과 브랜드 시그니처를 동시에
- 맥락이 기술적일 때만 Mono 사용 (코드, 커맨드, 버전, 키 쇼트컷)

### Don't
- 그라디언트를 배경·보더·아이콘 곳곳에 뿌리지 마라 — 포인트가 사라지고 "화려한 SaaS" 클리셰가 된다
- 완전한 `#ffffff` / `#000000`을 페이지 배경으로 쓰지 마라 — Horizon은 항상 약간의 블루 언더톤
- 섀도우로 깊이를 과장하지 마라 — 보더와 1px 하이라이트가 먼저, 섀도우는 떠 있는 요소에만
- 라디우스를 `24px` 이상으로 키우지 마라 — 프로덕트감이 "마케팅 팝"으로 무너진다
- Geist weight 300 이하를 본문에 쓰지 마라 — 다크 테마에서 뭉개진다

## 8. Responsive Behavior

### Breakpoints
| Name | Min Width | Notes |
|------|-----------|-------|
| `sm` | 640px | 모바일 가로, 2열 시작 |
| `md` | 768px | 태블릿 세로 |
| `lg` | 1024px | 태블릿 가로, 네비 풀 표시 |
| `xl` | 1280px | 데스크톱 기본 |
| `2xl` | 1536px | 와이드 데스크톱 |

### Scaling Rules
- 디스플레이 타이포: `clamp()`로 유체 스케일링. 예: `clamp(36px, 4vw + 16px, 64px)`
- 섹션 패딩: 모바일 `64px`, 데스크톱 `128px`
- 그라디언트 CTA는 모바일에서 풀 와이드(width 100%)로 전환, 데스크톱에서는 콘텐츠 폭에 따름
- 글래스 패널의 `backdrop-filter`는 저성능 디바이스에서 불투명 폴백 제공

## 9. Agent Prompt Guide

### Quick Color Reference

**Light Theme**
- 페이지: `#fbfbfd`
- 카드: `#ffffff`
- 텍스트 기본: `#0f1115`
- 텍스트 서브: `#4a4f5c`
- 보더: `rgba(11,13,18,0.06)` ~ `rgba(11,13,18,0.12)`
- 브랜드: `#5b5bd6`

**Dark Theme**
- 페이지: `#0b0d12`
- 카드: `#13151c`
- 텍스트 기본: `#f2f3f7`
- 텍스트 서브: `#a8acb8`
- 보더: `rgba(255,255,255,0.06)` ~ `rgba(255,255,255,0.10)`
- 브랜드: `#7c7cf0`

**Gradient**: `linear-gradient(135deg, #5b5bd6, #22d3ee 55%, #8b5cf6)`

### Example Component Prompts

- "Horizon 히어로 섹션. 페이지 배경은 `#fbfbfd`(라이트) / `#0b0d12`(다크). 64px Geist Sans weight 700, line-height 1.05, tracking -1.6px. 서브텍스트 18px weight 450. CTA는 그라디언트 버튼(radius 12px, padding 12px 20px, `linear-gradient(135deg, #5b5bd6, #22d3ee, #8b5cf6)`), 세컨더리는 고스트 버튼. 포커스 링 `#5b5bd6` 2px."
- "Horizon 피처 카드 3열 그리드. 각 카드 radius 14px, border 1px `rgba(11,13,18,0.06)`, 다크에서는 `rgba(255,255,255,0.06)`. 상단에 Geist Mono 11px 대문자 카테고리 라벨, 그 아래 H3 22px weight 650, 본문 14px weight 450 line-height 1.55. 호버 시 보더 진해지고 translateY(-2px) 리프트."
- "Horizon 내비게이션. 높이 64px, 배경 반투명 `rgba(255,255,255,0.82)` + backdrop-filter blur 14px. 링크 14px weight 550 `#4a4f5c`, 호버 `#0f1115`. 우측 CTA는 Primary dark 버튼(radius 10px)."
- "Horizon 모달: Glass Panel 스타일. 배경 `rgba(255,255,255,0.82)` + backdrop-filter blur 16px, border 1px subtle, radius 20px, shadow `0 24px 60px -20px rgba(11,13,18,0.25)`. 타이틀 H2 28px weight 700, 본문 15px weight 450."
- "Horizon 인풋 그룹: label 13px weight 600 대문자 tracking 1.2px, input radius 10px, 배경 라이트 `#ffffff`/다크 `#1a1d26`, 보더 `border.default`, 포커스 시 `#5b5bd6` 2px + 3px glow `rgba(91,91,214,0.18)`."

### Iteration Checklist
1. 페이지 배경이 쿨 페이퍼/미드나이트인가? (절대 순백/순흑 아님)
2. 브랜드 그라디언트가 페이지당 1~2곳에만 있는가?
3. 라디우스가 10–16px 존에서 동작하는가?
4. 포커스 링이 브랜드 인디고로 통일되어 있는가?
5. 다크 테마에서 1px 인너 하이라이트가 살아있는가?
6. Mono 폰트가 *정밀한 메타 컨텍스트*에만 쓰이는가?
