# Lawyalty

> **Law + Loyalty** — 부동산 거래에 꼭 필요한 법률 정보를, 가장 믿을 수 있는 형태로.

Lawyalty는 공공 법률 API에서 **현행 법령·판례·행정규칙**을 실시간으로 검색하고, 그 결과를 기반으로 AI가 부동산 관련 법률 질문에 답변해 주는 웹 애플리케이션입니다. 임대차, 매매, 등기, 재개발·재건축, 세금 등 일반인이 접근하기 어려운 부동산 법률 영역을 **출처 기반(grounded)** 답변으로 풀어냅니다.

> ⚠️ 현재 저장소는 **초기 개발(draft) 단계**입니다. 기능·구조·API 스펙이 자주 변경될 수 있습니다.

---

## ✨ Key Features

- **부동산 법률 검색** — 국가법령정보센터 등 공공 법률 API를 활용해 현행 법령/판례/행정규칙을 검색합니다.
- **AI 법률 Q&A** — 검색된 법률 문서를 근거로 LLM이 사용자의 질문에 답변합니다 (RAG 기반).
- **출처 링크 제공** — 모든 답변에는 근거가 된 법령·조문·판례의 원문 링크가 함께 표시됩니다.
- **부동산 특화 시나리오** — 임대차 계약, 보증금 반환, 전세사기 예방, 매매 계약, 등기, 세금 등 자주 묻는 상황별 가이드를 제공합니다.
- **대화형 인터페이스** — 꼬리질문을 이어가며 사용자의 구체적인 상황에 맞는 답을 찾아갈 수 있습니다.

---

## 🧱 Tech Stack

> 스택은 초기 단계라 변경될 수 있습니다.

- **Frontend**: TypeScript, React (Next.js 예정)
- **Styling**: CSS / Tailwind CSS
- **AI**: LLM 기반 RAG 파이프라인 (OpenAI / Anthropic Claude 등)
- **Legal Data Source**:
  - [국가법령정보센터 Open API](https://open.law.go.kr/)
  - 법제처 / 대법원 판례 데이터
- **Monorepo**: `web/` · `server/` 루트 기반 구조

---

## 📁 Project Structure

```
lawyalty/
├── web/            # 메인 웹 애플리케이션 (AI Q&A, 검색)
├── server/         # 백엔드 API 서버
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (권장) 또는 npm / yarn

### Installation

```bash
# 저장소 클론
git clone https://github.com/nicarinai/lawyalty.git
cd lawyalty

# 의존성 설치
pnpm install
```

### Environment Variables

프로젝트 루트 또는 각 앱 디렉토리에 `.env.local` 파일을 만들고 아래 값을 설정하세요.

```env
# 법률 API (국가법령정보센터 Open API)
LAW_API_KEY=your_law_go_kr_api_key
LAW_API_BASE_URL=https://www.law.go.kr

# AI (택 1 또는 병행)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Dev Server

```bash
# 랜딩 페이지
pnpm --filter landing dev

# 메인 웹 앱
pnpm --filter web dev
```

기본 접속 주소: [http://localhost:3000](http://localhost:3000)

---

## 🗺️ Roadmap

- [ ] 랜딩 페이지 초기 구현
- [ ] 법률 API 연동 (법령 검색)
- [ ] 판례 검색 기능
- [ ] RAG 기반 AI Q&A 파이프라인
- [ ] 사용자 계정 및 대화 히스토리 저장
- [ ] 부동산 시나리오별 템플릿 (임대차 / 매매 / 등기)
- [ ] 모바일 반응형 UI 고도화
- [ ] 유료 플랜 / 상담사 연결 기능

---

## ⚠️ Disclaimer

Lawyalty가 제공하는 답변은 **법률 참고 자료**이며, 변호사의 공식 법률 자문을 대체하지 않습니다.
구체적인 사건·분쟁·계약에 대한 결정은 반드시 **자격 있는 변호사** 또는 **법무사**와 상담하시기 바랍니다.

---

## 🤝 Contributing

현재는 비공개 초기 개발 단계이나, 기여·피드백은 언제든 환영합니다.

1. 이슈를 열어 논의를 시작해 주세요.
2. Fork → Branch (`feat/your-feature`) → PR 순서로 진행합니다.
3. 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 를 따라 주세요.

---

## 📄 License

TBD (예정). 별도 명시 전까지는 모든 권리는 저작권자에게 있습니다.

---

## 📮 Contact

- **Maintainer**: [@nicarinai](https://github.com/nicarinai)
- **Repository**: [github.com/nicarinai/lawyalty](https://github.com/nicarinai/lawyalty)
