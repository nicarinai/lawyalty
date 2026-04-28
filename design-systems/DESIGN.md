# Design System: 라윌티 시그니처 버건디 (Signature Burgundy)

> 건축주·공인중개사·건축사를 위한 *신뢰 기반 법령 검토 서비스*.
> 관공서 문서의 엄정함과 프리미엄 법무의 격조를 결합한 딥 버건디(`#6B2135`) 톤.
> 라이트 테마 단일 운용. 기본 라디우스 `8px`, 장식 최소화, 정보 밀도 우선.

---

## 1. Visual Theme & Atmosphere

라윌티는 "신뢰할 수 있는 공식 서비스"를 시각적으로 구현한다. 배경은 순백(`#ffffff`)과 오프화이트(`#FCFBFC`) 두 레이어로 구성되며, 종이 문서를 읽는 듯한 안정감을 준다. 완전한 `#ffffff`는 카드·입력란처럼 포커스가 필요한 영역에만 허용하고, 패널과 사이드바는 오프화이트로 공간을 자연스럽게 분리한다.

브랜드 포인트는 딥 버건디(`#6B2135`) — 법무·금융 영역의 신뢰감을 상징하면서도 클래식한 관공서 이미지를 탈피한 프리미엄 느낌을 전달한다. 버건디는 **CTA·로고·강조 텍스트·인터랙티브 상태**에만 등장하며, 기본 화면에서는 조용히 침잠해 있다가 사용자의 눈이 향하는 곳에서 빛난다. 소프트 핑크(`#F5E6E8`)는 활성 상태·호버 배경·세컨더리 영역에서 버건디를 부드럽게 반향한다.

타이포는 **Pretendard Variable** 단일 패밀리. 한글 자소 간격, 받침 처리, 굵기 연속성이 웹 폰트 중 최상급이며 법령 조항처럼 긴 텍스트를 읽을 때도 피로가 낮다. 기본 본문 크기는 **17px / 1.75 행간** — 일반 웹 서비스(14px)보다 크게 설정해 40대 이상 타겟층의 가독성을 보장한다.

Signature Burgundy의 핵심은 **"문서형 신뢰"**이다. 화려한 그라디언트나 깊은 그림자 대신, 1px 실선 보더와 넉넉한 여백이 레이아웃의 품격을 결정한다.

**Key Characteristics**
- 딥 버건디를 *포인트 컬러*로만 사용 — CTA·로고·강조 상태에 집중
- 배경은 오프화이트(`#FCFBFC`) → 카드는 순백(`#ffffff`) 두 레이어
- Pretendard Variable 단일 폰트, 17px 기본, 행간 1.75
- 기본 라디우스 `8px`, 버튼 `8px`, 카드 `10px`, 모달 `12px`
- 그림자 배제 — 1px `#E8D8DB` 보더로만 공간 구분
- 포커스 링은 버건디 `#6B2135` 2px + 오프셋 2px
- 라이트 테마 전용. 다크 테마 없음

---

## 2. Color Palette & Roles

### Brand (버건디 스케일)
| Token | Value | Role |
|-------|-------|------|
| `brand.burgundy` | `#6B2135` | 주요 브랜드 / CTA / 포커스 링 |
| `brand.burgundy-hover` | `#561A2A` | 버튼 호버·액티브 |
| `brand.burgundy-deep` | `#401220` | 드롭다운·오버레이 버건디 |
| `brand.pink-soft` | `#F5E6E8` | 호버 배경, 세컨더리 영역 |
| `brand.pink-light` | `#FCFBFC` | 페이지 배경, 사이드바 |

### Surfaces
| Token | Value | Role |
|-------|-------|------|
| `surface.page` | `#FCFBFC` | 전체 페이지 배경 |
| `surface.sidebar` | `#F8F5F6` | LNB·인스펙터 패널 |
| `surface.card` | `#FFFFFF` | 카드·입력란·말풍선 |
| `surface.muted` | `#F5E6E8` | 서브 정보 영역, 비활성 배지 배경 |
| `surface.sunken` | `#F0E8EA` | 코드블록, 내부 구분 영역 |

### Text
| Token | Value | Role |
|-------|-------|------|
| `text.primary` | `#1C1214` | 헤딩·본문 |
| `text.secondary` | `#4A3A3E` | 서브텍스트·설명 |
| `text.muted` | `#7A6268` | 캡션·플레이스홀더·타임스탬프 |
| `text.brand` | `#6B2135` | 브랜드 강조·링크 |
| `text.inverse` | `#FFFFFF` | 버건디 배경 위 텍스트 |

### Borders & Dividers
| Token | Value | Role |
|-------|-------|------|
| `border.subtle` | `#F0E8EA` | 최소한의 구분선 |
| `border.default` | `#E8D8DB` | 기본 카드·패널 보더 |
| `border.strong` | `#D4B0B7` | 강조 보더, 중요 섹션 |
| `border.brand` | `#6B2135` | 활성 상태, 포커스, 중요 법령 카드 |

### Semantic
| Token | Value | Role |
|-------|-------|------|
| `success` | `#059669` | 법령 연동 정상, 검증 완료 |
| `warning` | `#D97706` | 조례 확인 필요, 주의 사항 |
| `danger` | `#DC2626` | 위반 가능성, 오류 |
| `info` | `#2563EB` | 참고 정보, 안내 |

세맨틱 색상 배경은 항상 해당 컬러 6–10% 알파(예: `bg-emerald-50`, `bg-amber-50`)로 설정하여 과도한 채도를 피한다.

### Tailwind CSS 변수 매핑
```css
--background:         300 14% 99%;   /* #FCFBFC */
--foreground:         345 25% 10%;   /* #1C1214 */
--primary:            345 53% 27%;   /* #6B2135 */
--primary-foreground: 0 0% 100%;     /* #FFFFFF */
--secondary:          345 40% 93%;   /* #F5E6E8 */
--border:             345 28% 87%;   /* #E8D8DB */
--muted:              345 20% 96%;
--muted-foreground:   345 12% 50%;
--ring:               345 53% 27%;   /* 포커스 링 = primary */
```

---

## 3. Typography Rules

### Font Stack
```css
font-family: 'Pretendard Variable', Pretendard, -apple-system,
             BlinkMacSystemFont, system-ui, Roboto, sans-serif;
```
CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`

영문·숫자가 혼재하는 법령 조항(제77조, 60%, 1,000㎡ 등)에서도 Pretendard는 자연스러운 혼식 처리를 제공한다.

### Hierarchy

| Role | Size | Weight | Line Height | Tracking | Use |
|------|------|--------|-------------|----------|-----|
| Display | 32px | 700 | 1.25 | -0.04em | 랜딩 히어로 |
| H1 | 26px | 700 | 1.30 | -0.03em | 페이지 타이틀 |
| H2 | 22px | 700 | 1.35 | -0.02em | 섹션 제목 |
| H3 | 18px | 600 | 1.40 | -0.01em | 카드 타이틀, 서브섹션 |
| H4 | 16px | 600 | 1.45 | 0em | 컴포넌트 레이블 |
| Body L | 17px | 400 | 1.75 | 0em | 메인 채팅 본문, 법령 내용 |
| Body | 15px | 400 | 1.70 | 0em | 카드 본문, 설명 |
| Body S | 13px | 400 | 1.65 | 0em | 미리보기 텍스트 |
| UI / Nav | 14px | 500 | 1.45 | 0em | 버튼·내비·배지 레이블 |
| Caption | 12px | 500 | 1.40 | 0.02em | 타임스탬프·메타 |
| Label Upper | 11px | 600 | 1.30 | 0.08em | 섹션 구분 대문자 라벨 |

### Principles
- 본문 최소 크기는 **13px** — 이 이하는 접근성 위반으로 간주
- 법령 조항·검토 결과 텍스트는 항상 Body L(17px/1.75)로 — 빽빽한 내용을 숨 쉬며 읽을 수 있어야 한다
- 섹션 구분 레이블(`최근 검토 내역`, `법령 근거` 등)은 Label Upper 스타일: 11px / 600 / 대문자 / `tracking-widest`
- Bold 강조(`**텍스트**`)는 `font-weight: 600` — 700은 한글에서 너무 진해진다
- 링크는 버건디 컬러 + hover 시 underline. 인라인 법령 참조는 이 스타일을 따른다

---

## 4. Component Stylings

### Buttons

**Primary (버건디 솔리드)**
- Background: `#6B2135`, Color: `#FFFFFF`
- Radius: `8px`, Padding: `10px 16px`, Font: 14px / 500
- Hover: `background: #561A2A`
- Focus: `outline: 2px solid #6B2135; outline-offset: 2px`
- Disabled: `opacity: 0.4`, `cursor: not-allowed`
- *페이지의 주요 행동 1개에만* — `새 검토 시작`, `전송` 등

**Secondary (아웃라인)**
- Background: `#FFFFFF`, Border: `1px solid #E8D8DB`, Color: `#1C1214`
- Hover: `background: #F5E6E8`, `border-color: #6B2135/30`
- 하위 액션·취소에 사용

**Ghost**
- Background: 투명, Color: `#7A6268`
- Hover: `background: #F5E6E8`, Color: `#1C1214`
- 아이콘 버튼·툴바·보조 액션에 사용

**Destructive**
- Background: `#DC2626`, Color: `#FFFFFF`
- 삭제·초기화 같은 파괴적 액션에만

### Cards

**Standard Card (법령 카드, 정보 카드)**
- Background: `#FFFFFF`
- Border: `1px solid #E8D8DB`
- Radius: `10px`
- Padding: `16px`
- Shadow: 없음
- Hover(인터랙티브): `border-color: #6B2135/30`, `background: #F5E6E8/40`

**Important Card (중요 법령 조항)**
- Border-left: `3px solid #6B2135` (`law-highlight` 클래스)
- Background: `hsl(345 40% 97%)`
- 나머지는 Standard Card와 동일

**Summary Card (검토 요약)**
- Background: `#6B2135`
- Color: `#FFFFFF` (본문), `#F5E6E8/70` (라벨)
- Radius: `10px`, Padding: `16px`
- 수치(`60%`, `1,000㎡`)는 18px / 700 white로 강조

### Chat Bubbles

**AI 말풍선 (bubble-ai)**
```css
background: #FFFFFF;
border: 1px solid #E8D8DB;
border-radius: 0 16px 16px 16px;
padding: 14px 16px;
```

**사용자 말풍선 (bubble-user)**
```css
background: #6B2135;
color: #FFFFFF;
border-radius: 16px 0 16px 16px;
padding: 14px 16px;
```

Bold 마크다운(`**텍스트**`)은 `font-weight: 600`으로 인라인 렌더링. 코드블록이나 복잡한 HTML은 사용하지 않는다.

### Inputs & Textarea

- Background: `#FFFFFF`
- Border: `2px solid #E8D8DB`
- Radius: `16px` (입력 컨테이너), `8px` (단독 인풋)
- Padding: `12px 16px`, Font: 15px / 400
- Placeholder: `#7A6268/60`
- Focus: `border-color: #6B2135/50` (transition 포함)
- 전송 버튼은 입력 컨테이너 내부 우하단에 배치 — 독립 버튼이 아님

### Navigation (LNB)

- Width: `268px`, Background: `#F8F5F6`
- Border-right: `1px solid #E8D8DB`
- 로고 영역: 높이 `68px`, 버건디 아이콘(32px 정사각형 `rounded-lg`) + 워드마크 19px / 700
- 내비 아이템 기본: 13px / 500, Color: `#1C1214`
- 내비 아이템 Hover: `background: #F5E6E8/60`
- 내비 아이템 Active (`nav-active`): `background: #F5E6E8`, Color: `#6B2135`, `font-weight: 600`
- 섹션 구분 라벨: 11px / 600 / 대문자 / `tracking-widest`, Color: muted-foreground
- 사용자 프로필: 하단 고정, 버건디 원형 아바타(32px)

### Inspector Panel

- Width: `308px`, Background: `#F8F5F6`
- Border-left: `1px solid #E8D8DB`
- 헤더: `BookOpen` 아이콘(버건디) + 타이틀 14px / 600
- 법령 카드 목록: Standard / Important Card 혼용
- 태그 배지: 10.5px / 500, Background: `#F5E6E8`, Color: `#6B2135`, Border: `1px solid #E8D8DB`, Radius: 9999px
- 하단 동기화 상태: 11px / muted + `CheckCircle2` (emerald)

### Badge / Tag

**카테고리 배지 (LNB 대화 목록)**
- Radius: `9999px`, Padding: `2px 8px`, Font: 10px / 600
- 컬러별 매핑:
  - 건폐율: `bg-[#F5E6E8] text-[#6B2135] border-[#E8D8DB]`
  - 용적률: `bg-amber-50 text-amber-700 border-amber-200`
  - 용도지역: `bg-blue-50 text-blue-700 border-blue-200`
  - 주차: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - 일조권: `bg-violet-50 text-violet-700 border-violet-200`

**AI 뱃지 (로고 옆)**
- Font: 10px / 600 / 대문자 tracking-widest
- Background: `#F5E6E8`, Color: `#6B2135`, Border: `1px solid #E8D8DB`
- Radius: 9999px

### Typing Indicator

```css
/* 바운싱 점 3개 */
.typing-dot {
  width: 6px; height: 6px;
  background: #6B2135;
  border-radius: 50%;
  animation: bounce-dot 1.4s infinite ease-in-out;
}
```
텍스트: `법령을 분석하고 있습니다...` — 13px / muted-foreground, `analyzing` 펄스 애니메이션 적용.
절대 "Loading...", "Please wait..." 같은 영문 메시지를 쓰지 않는다.

---

## 5. Layout Principles

### 3-Panel Structure (메인 앱)
```
┌──────────────────────────────────────────────────────────┐
│  LNB (268px)  │  Chat (flex-1, min-width 0)  │  Inspector (308px) │
│  #F8F5F6      │  #FFFFFF                     │  #F8F5F6           │
│  border-r     │                              │  border-l          │
└──────────────────────────────────────────────────────────┘
```
- 패널 폭은 고정(`shrink-0`). 채팅 영역만 유동
- LNB·Inspector는 독립적으로 토글 가능 (transition-all duration-300)
- 채팅 콘텐츠 최대 폭: `max-w-3xl` (768px) — 더 넓으면 법령 텍스트가 한 줄에 너무 길어진다

### Spacing System (4pt 기반)
- Scale: `2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64`
- 카드 내부 패딩: `16px`
- 메시지 간 수직 간격: `24px` (`space-y-6`)
- 패널 내부 요소 간: `8–12px`
- 입력 영역 하단 여백: `20px` (엄지 닿는 영역 확보)

### Grid & Container
- 앱 레이아웃: Flexbox 3열
- 채팅 콘텐츠: 중앙 정렬 `mx-auto`, 좌우 패딩 `px-5`
- 인스펙터 카드: 전체 폭 사용(`w-full`), 외부 그리드 없음

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `radius.xs` | `4px` | 작은 배지, 인라인 태그 |
| `radius.sm` | `6px` | 작은 버튼, 내부 요소 |
| `radius.md` | `8px` | 버튼·인풋 기본 |
| `radius.lg` | `10px` | 카드·패널 기본 |
| `radius.xl` | `12px` | 모달·팝오버 |
| `radius.2xl` | `16px` | 말풍선·입력 컨테이너 |
| `radius.pill` | `9999px` | 배지·아바타·태그 |

---

## 6. Depth & Elevation

### Elevation Philosophy
라윌티는 그림자를 사용하지 않는다. 공간 분리는 전적으로 **배경색 차이 + 1px 실선 보더**로 처리한다.

| Level | 방법 | Use |
|-------|------|-----|
| 0 | 배경 없음 | 페이지 캔버스(`#FCFBFC`) |
| 1 | `border: 1px solid #E8D8DB` | 카드·패널 기본 |
| 2 | `border: 1px solid #D4B0B7` + `background: #FFFFFF` | 호버, 활성 카드 |
| 3 | `border-left: 3px solid #6B2135` | 중요 법령 조항 |
| 4 | 버건디 배경(`#6B2135`) | 검토 요약 카드, CTA |

"그림자 없는 디자인은 날것처럼 보인다"는 우려가 있지만, 배경색 레이어(#FCFBFC → #F8F5F6 → #FFFFFF)가 충분한 깊이를 만든다. 그림자를 추가하는 순간 법무·공식 서비스의 절제된 인상이 무너진다.

---

## 7. Do's and Don'ts

### Do
- 버건디를 *주요 행동과 상태*에만 사용 — 로고, CTA, 포커스, 중요 카드 좌측 보더, 활성 내비
- 본문 폰트 최소 17px. 법령 조항은 절대 14px 이하로 줄이지 않는다
- 행간은 1.7 이상 — 숫자와 법령 문장이 뭉치지 않게
- 에러·상태 메시지는 반드시 한글로: `요청하신 주소의 데이터를 불러올 수 없습니다`
- 버튼 레이블은 동사형 명확한 한글: `새 검토 시작`, `법령 확인`, `전송`
- 인터랙티브 요소에 포커스 링 필수 — 버건디 2px + offset 2px

### Don't
- 그림자(`box-shadow`)를 인터랙티브 리프트에 쓰지 말 것 — 보더 강화로 대체
- 버건디 배경을 카드 본문에 남용하지 말 것 — 검토 요약 1곳에만
- 영문 약어 노출 금지: `LNB` → 표시 안 함, `Settings` → `환경 설정`, `Loading...` → `분석 중...`
- 라디우스를 `20px` 이상으로 키우지 말 것 — 공식 서비스의 절제감이 "앱스럽게" 무너진다
- 카테고리 배지를 단독으로 문장처럼 쓰지 말 것 — 항상 제목·제목 앞에 붙는 레이블 역할
- 소프트 핑크(`#F5E6E8`)를 배경 전체에 깔지 말 것 — 호버/활성 배경·세컨더리 영역에만

---

## 8. Responsive Behavior

### Breakpoints
| Name | Min Width | 동작 |
|------|-----------|------|
| `sm` | 640px | 모바일. LNB 숨김, Inspector 숨김 |
| `md` | 768px | 태블릿. Inspector만 숨김 |
| `lg` | 1024px | 양쪽 패널 표시 가능 |
| `xl` | 1280px | 기본 데스크톱 레이아웃 |
| `2xl` | 1536px | 채팅 `max-w-4xl`로 확장 가능 |

### Scaling Rules
- 모바일: 단일 컬럼, LNB는 슬라이드인 오버레이, Inspector는 바텀 시트
- 폰트 스케일은 고정 — `clamp()` 미사용. 법령 텍스트는 축소하지 않는다
- 입력 영역은 모바일에서 `position: sticky; bottom: 0` — 키보드 올라와도 항상 접근 가능
- 버건디 요약 카드는 모바일에서 채팅 상단 콜랩서블 배너로 대체 가능

---

## 9. Agent Prompt Guide

### Quick Color Reference
```
배경(페이지):   #FCFBFC
배경(사이드바): #F8F5F6
카드:           #FFFFFF
텍스트 기본:    #1C1214
텍스트 서브:    #4A3A3E
텍스트 뮤트:    #7A6268
보더:           #E8D8DB
브랜드 버건디:  #6B2135
버건디 호버:    #561A2A
소프트 핑크:    #F5E6E8
```

### Example Component Prompts

- **메인 채팅 레이아웃**: "라윌티 3패널 레이아웃. 좌측 LNB 268px(`#F8F5F6`, 우측 보더 `#E8D8DB`), 메인 채팅(`#FFFFFF`), 우측 인스펙터 308px(`#F8F5F6`, 좌측 보더 `#E8D8DB`). 폰트 Pretendard Variable 17px/1.75."

- **AI 말풍선**: "라윌티 AI 말풍선. 배경 `#FFFFFF`, 보더 `1px solid #E8D8DB`, border-radius `0 16px 16px 16px`. 좌측에 버건디(`#6B2135`) 원형 아바타 32px + 저울 아이콘. 텍스트 `#1C1214` 17px/1.75. `**텍스트**`는 `font-weight: 600` 인라인 bold로."

- **버건디 요약 카드**: "라윌티 검토 요약 카드. 배경 `#6B2135`, radius 10px, padding 16px. 라벨 11px `#F5E6E8/70`, 수치 18px/700 `#FFFFFF`. 구분선 `rgba(255,255,255,0.1)`."

- **법령 근거 카드 (중요)**: "중요 법령 카드. 배경 `hsl(345 40% 97%)`, border-left `3px solid #6B2135`, 나머지 보더 `1px solid #E8D8DB/30`, radius 10px. 태그 배지: 10.5px/500, 배경 `#F5E6E8`, 컬러 `#6B2135`, 보더 `#E8D8DB`, radius 9999px."

- **LNB 내비 아이템**: "라윌티 LNB 내비 아이템. 기본: 13px/500 `#1C1214`, hover `background: #F5E6E8/60`. 활성: `background: #F5E6E8`, `color: #6B2135`, `font-weight: 600`. 카테고리 배지는 10px/600 pill 스타일로 제목 위에 배치."

- **입력 컨테이너**: "라윌티 채팅 입력창. 배경 `#FFFFFF`, 보더 `2px solid #E8D8DB`, radius 16px. focus-within 시 `border-color: #6B2135/50`. 내부 Textarea padding 0, placeholder `#7A6268/60`. 우하단에 버건디 전송 버튼(36px 정사각형, radius 12px)."

- **타이핑 인디케이터**: "라윌티 분석 중 인디케이터. 버건디(`#6B2135`) 6px 원 3개, bounce-dot 1.4s 애니메이션(딜레이 0/0.2/0.4s). 오른쪽에 `법령을 분석하고 있습니다...` 12px muted 텍스트, analyzing 펄스 0.6–1.0 opacity."

### Iteration Checklist
1. 버건디가 CTA·로고·포커스·중요 보더에만 있는가? (배경에 남용 없음)
2. 본문 폰트가 최소 13px, 법령 텍스트가 17px 이상인가?
3. 그림자 없이 보더+배경색으로만 공간이 분리되는가?
4. 모든 상태 메시지와 버튼 레이블이 한글인가?
5. 포커스 링이 버건디 2px + offset 2px로 설정되어 있는가?
6. 중요 법령 카드에 `border-left: 3px solid #6B2135`가 적용되어 있는가?
7. 배지·태그가 pill 형태(`radius: 9999px`)이며 과도하게 많지 않은가?
