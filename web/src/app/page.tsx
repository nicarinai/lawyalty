'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus, MessageSquare, Settings, ChevronRight,
  Send, Paperclip, Scale, BookOpen, FileText,
  Building2, MapPin, AlertCircle, CheckCircle2,
  ExternalLink, Menu, X, Sparkles, Clock
} from 'lucide-react';

// ─── 타입 ────────────────────────────────────────────────────────
type Role = 'user' | 'ai';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  time: string;
  category: '건폐율' | '용적률' | '용도지역' | '주차' | '일조권' | '기타';
}

interface LawRef {
  title: string;
  article: string;
  content: string;
  tags: string[];
  important?: boolean;
}

// ─── 목업 데이터 ─────────────────────────────────────────────────
const SAMPLE_CONVERSATIONS: ConversationItem[] = [
  { id: '1', title: '제2종 일반주거지역 건폐율', preview: '최대 60%까지 가능하나 지자체 조례에...', time: '방금 전', category: '건폐율' },
  { id: '2', title: '근린생활시설 주차 대수 산정', preview: '연면적 134㎡ 초과 시 1대 기준으로...', time: '1시간 전', category: '주차' },
  { id: '3', title: '역세권 용적률 완화 조건', preview: '역 경계선 250m 이내, 준주거지역 기준...', time: '어제', category: '용적률' },
  { id: '4', title: '일조권 사선제한 적용 기준', preview: '인접 대지 경계선으로부터 높이에 따라...', time: '2일 전', category: '일조권' },
  { id: '5', title: '상업지역 용도지역 변경 절차', preview: '도시관리계획 변경 신청 → 주민 열람...', time: '3일 전', category: '용도지역' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'ai',
    content: '안녕하세요! 라윌티 AI입니다.\n\n건축법, 국토의 계획 및 이용에 관한 법률(국토계획법), 주택법 등 **건축·부동산 관련 규제**를 검토해 드립니다.\n\n어떤 내용이 궁금하신가요? 대지 면적, 위치, 용도 등을 함께 알려주시면 더 정확한 답변을 드릴 수 있습니다.',
    timestamp: '09:30',
  },
  {
    id: 'q1',
    role: 'user',
    content: '서울 강남구 역삼동 소재 대지 500㎡에 근린생활시설을 신축하려고 합니다. 해당 토지가 제2종 일반주거지역인데, 건폐율과 용적률 기준이 어떻게 되나요?',
    timestamp: '09:31',
  },
  {
    id: 'a1',
    role: 'ai',
    content: '역삼동 제2종 일반주거지역 기준으로 말씀드리겠습니다.\n\n**■ 건폐율**\n- 법적 상한: **60% 이하** (국토계획법 제77조, 시행령 별표13)\n- 서울시 조례 적용 시: **60% 이하** 동일 적용\n- 귀하의 대지(500㎡) 기준 최대 건축면적: **300㎡**\n\n**■ 용적률**\n- 법적 상한: 200% 이하 (국토계획법 시행령)\n- 서울시 조례(서울특별시 도시계획 조례 제55조): **200% 이하**\n- 대지(500㎡) 기준 연면적 상한: **1,000㎡**\n\n**■ 추가 검토 필요 사항**\n근린생활시설 신축 시 아래 항목도 반드시 확인하시기 바랍니다.\n1. **주차장**: 연면적 기준 의무 주차 대수 산정 필요\n2. **일조권 사선제한**: 인접 대지 경계선 기준 적용\n3. **도로 사선제한**: 전면 도로 폭 기준 높이 제한\n\n구체적인 건축계획안이 있으시면 더 상세히 검토해 드릴 수 있습니다.',
    timestamp: '09:31',
  },
];

const LAW_REFERENCES: LawRef[] = [
  {
    title: '국토의 계획 및 이용에 관한 법률',
    article: '제77조 (건폐율)',
    content: '용도지역에서의 건폐율은 다음 각 호의 범위에서 대통령령으로 정하는 기준에 따라 특별시·광역시·특별자치시·특별자치도·시 또는 군의 조례로 정한다.',
    tags: ['건폐율', '제2종일반주거'],
    important: true,
  },
  {
    title: '국토계획법 시행령',
    article: '별표13 (제2종 일반주거지역)',
    content: '건폐율: 60% 이하 / 용적률: 100% 이상 250% 이하 (조례로 정하는 비율 적용)',
    tags: ['건폐율', '용적률'],
    important: true,
  },
  {
    title: '서울특별시 도시계획 조례',
    article: '제55조 (용적률)',
    content: '제2종 일반주거지역의 용적률은 200% 이하로 한다. 다만, 역세권 등 특정 구역은 완화 적용 가능.',
    tags: ['용적률', '서울시'],
  },
  {
    title: '건축법',
    article: '제53조 (일조 등의 확보)',
    content: '전용주거지역과 일반주거지역 안에서 건축하는 건축물의 높이는 일조 등의 확보를 위하여 정북방향의 인접 대지 경계선으로부터의 거리에 따라 제한된다.',
    tags: ['일조권', '높이제한'],
  },
];

// 카테고리 배지 — 모두 화이트 글래스, 텍스트 색만 다르게
const CATEGORY_COLORS: Record<ConversationItem['category'], string> = {
  '건폐율': 'bg-white/60 text-foreground border-white/85',
  '용적률': 'bg-white/60 text-amber-700 border-white/85',
  '용도지역': 'bg-white/60 text-blue-700 border-white/85',
  '주차': 'bg-white/60 text-emerald-700 border-white/85',
  '일조권': 'bg-white/60 text-violet-700 border-white/85',
  '기타': 'bg-white/60 text-muted-foreground border-white/85',
};

// ─── 메시지 렌더러 ────────────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="whitespace-pre-line text-[15px] leading-[1.75]">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// ─── 타이핑 인디케이터 ────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
      <span className="ml-1.5 text-xs text-muted-foreground analyzing">
        법령을 분석하고 있습니다...
      </span>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeConv, setActiveConv] = useState('1');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAnalyzing]);

  function handleSend() {
    const text = input.trim();
    if (!text || isAnalyzing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '해당 질의에 대한 법령 검토 결과입니다.\n\n현재 입력하신 내용을 기반으로 관련 법령을 분석하고 있습니다. 실제 서비스에서는 국가법령정보센터 API와 연동하여 정확한 최신 법령 조항을 제공합니다.\n\n**추가 정보를 제공해 주시면** 더 정확한 검토가 가능합니다:\n- 대지 위치 (시/구/동)\n- 용도지역·지구\n- 건축물 용도 및 규모',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsAnalyzing(false);
    }, 2200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── 좌측 내비게이션 바 (LNB) — 리퀴드 글래스 ─────────────── */}
      <aside
        className={`
          liquid-glass-strong
          flex flex-col rounded-none border-y-0 border-l-0
          transition-all duration-300 ease-in-out shrink-0
          ${sidebarOpen ? 'w-[268px]' : 'w-0 overflow-hidden'}
        `}
      >
        {/* 로고 */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[rgba(225,229,236,0.7)]">
          <div className="w-9 h-9 rounded-xl liquid-glass-strong flex items-center justify-center">
            <Scale className="w-4 h-4 text-foreground" />
          </div>
          <span className="logo-wordmark text-[19px]">라윌티</span>
          <Badge variant="secondary" className="ml-auto text-[10px] tracking-widest">
            AI
          </Badge>
        </div>

        {/* 새 검토 시작 버튼 — 버건디 글래스 CTA */}
        <div className="px-4 pt-4 pb-3">
          <Button size="lg" className="w-full gap-2 font-semibold">
            <Plus className="w-4 h-4" />
            새 검토 시작
          </Button>
        </div>

        {/* 최근 검토 목록 */}
        <div className="px-4 pt-2 pb-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-2 px-1">
            최근 검토 내역
          </p>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {SAMPLE_CONVERSATIONS.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`
                  w-full text-left px-3 py-3 rounded-lg transition-all group
                  ${activeConv === conv.id
                    ? 'nav-active'
                    : 'hover:bg-white/55 hover:backdrop-blur-md hover:backdrop-saturate-150 text-foreground'}
                `}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${activeConv === conv.id ? 'text-foreground' : 'text-muted-foreground'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`
                        inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
                        backdrop-blur-md backdrop-saturate-150
                        ${CATEGORY_COLORS[conv.category]}
                      `}>
                        {conv.category}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium leading-snug truncate">
                      {conv.title}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                      {conv.preview}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10.5px] text-muted-foreground">{conv.time}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator className="bg-[rgba(232,216,219,0.55)]" />

        {/* 하단: 사용자 정보 & 환경설정 */}
        <div className="px-3 py-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/55 hover:backdrop-blur-md hover:backdrop-saturate-150 transition-colors text-left">
            <div className="w-9 h-9 rounded-full liquid-glass-circle flex items-center justify-center shrink-0">
              <span className="text-[12px] font-semibold text-foreground">나</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate">나성채 님</p>
              <p className="text-[11px] text-muted-foreground truncate">공인중개사</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/55 hover:backdrop-blur-md hover:backdrop-saturate-150 transition-colors text-[13px] text-muted-foreground">
            <Settings className="w-4 h-4" />
            환경 설정
          </button>
        </div>
      </aside>

      {/* ── 메인 채팅 영역 ─────────────────────────────────────── */}
      <main className="flex flex-col flex-1 min-w-0">

        {/* 채팅 헤더 — 얕은 글래스 스트립 */}
        <header className="liquid-glass-subtle flex items-center gap-3 px-5 py-3.5 rounded-none border-x-0 border-t-0 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSidebarOpen(v => !v)}
          >
            <Menu className="w-4 h-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-foreground shrink-0" />
              <h1 className="text-[15px] font-semibold truncate text-foreground">
                제2종 일반주거지역 건폐율·용적률 검토
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                서울 강남구 역삼동
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[11.5px] text-muted-foreground">근린생활시설 500㎡</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-700 liquid-glass px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              법령 연동 정상
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setInspectorOpen(v => !v)}
              title="관련 법령 패널"
            >
              <BookOpen className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 메시지 스크롤 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 아바타 */}
                {msg.role === 'ai' && (
                  <div className="w-9 h-9 rounded-full liquid-glass-circle flex items-center justify-center shrink-0 mt-1">
                    <Scale className="w-4 h-4 text-foreground" />
                  </div>
                )}
                {msg.role === 'user' && (
                  <Avatar className="w-9 h-9 shrink-0 mt-1 liquid-glass-tint">
                    <AvatarFallback className="bg-transparent text-foreground text-[12px] font-semibold">나</AvatarFallback>
                  </Avatar>
                )}

                {/* 말풍선 */}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {msg.role === 'ai' && (
                    <span className="text-[11.5px] font-semibold text-foreground mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      라윌티 AI
                    </span>
                  )}
                  <div className={`px-4 py-3.5 ${msg.role === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>
                    <MessageContent content={msg.content} />
                  </div>
                  <span className="text-[10.5px] text-muted-foreground px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* 분석 중 인디케이터 */}
            {isAnalyzing && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-9 h-9 rounded-full liquid-glass-circle flex items-center justify-center shrink-0 mt-1">
                  <Scale className="w-4 h-4 text-foreground" />
                </div>
                <div className="bubble-ai px-1 py-1">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 질문 제안 (최초 상태일 때) */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <div className="max-w-3xl mx-auto">
              <p className="text-[12px] text-muted-foreground mb-2 font-medium">자주 묻는 질문</p>
              <div className="flex flex-wrap gap-2">
                {[
                  '건폐율·용적률 확인',
                  '주차 대수 산정',
                  '일조권 사선제한',
                  '용도지역 변경 절차',
                  '건축허가 서류 목록',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="liquid-glass liquid-glass-interactive text-[13px] px-3.5 py-1.5 rounded-full text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 입력 영역 — 글래스 컨테이너 */}
        <div className="px-5 pb-5 pt-3 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="liquid-glass-strong flex gap-2 items-end rounded-2xl px-4 py-3 transition-colors focus-within:border-[var(--glass-border-active)]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="대지 위치, 용도지역, 건축물 용도 등을 포함하여 질문해 주세요..."
                className="flex-1 min-h-[44px] max-h-[160px] text-[15px] leading-[1.65] px-1 py-1 resize-none bg-transparent border-0 outline-none placeholder:text-muted-foreground/70 text-foreground"
                rows={1}
              />
              <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isAnalyzing}
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground mt-2.5">
              라윌티 AI는 법령 정보를 제공하나 법적 효력이 있는 유권해석이 아닙니다. 중요 사항은 담당 기관에 직접 확인하세요.
            </p>
          </div>
        </div>
      </main>

      {/* ── 우측 인스펙터 패널 — 리퀴드 글래스 ──────────────────── */}
      <aside
        className={`
          liquid-glass-strong
          flex flex-col rounded-none border-y-0 border-r-0
          transition-all duration-300 ease-in-out shrink-0
          ${inspectorOpen ? 'w-[308px]' : 'w-0 overflow-hidden'}
        `}
      >
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(225,229,236,0.7)] shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-foreground" />
            <h2 className="text-[14px] font-semibold text-foreground">관련 법령</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setInspectorOpen(false)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4">

            {/* 검토 요약 카드 — 강조 화이트 글래스, 잉크 텍스트 */}
            <Card variant="burgundy">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">검토 요약</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-muted-foreground">건폐율 상한</span>
                    <span className="text-[17px] font-bold text-foreground tracking-tight">60%</span>
                  </div>
                  <div className="h-px bg-[rgba(60,70,90,0.10)]" />
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-muted-foreground">용적률 상한</span>
                    <span className="text-[17px] font-bold text-foreground tracking-tight">200%</span>
                  </div>
                  <div className="h-px bg-[rgba(60,70,90,0.10)]" />
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-muted-foreground">최대 건축면적</span>
                    <span className="text-[17px] font-bold text-foreground tracking-tight">300㎡</span>
                  </div>
                  <div className="h-px bg-[rgba(60,70,90,0.10)]" />
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-muted-foreground">연면적 상한</span>
                    <span className="text-[17px] font-bold text-foreground tracking-tight">1,000㎡</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 법령 근거 목록 */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">법령 근거</p>
              <div className="space-y-2.5">
                {LAW_REFERENCES.map((law, i) => (
                  <Card
                    key={i}
                    variant="default"
                    className={`p-3.5 ${law.important ? 'law-highlight' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground leading-snug">{law.title}</p>
                        <p className="text-[13px] font-semibold text-foreground mt-0.5">{law.article}</p>
                      </div>
                      {law.important && (
                        <span className="shrink-0 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-foreground" />
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{law.content}</p>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {law.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10.5px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <button className="mt-2.5 flex items-center gap-1 text-[11.5px] text-foreground hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      국가법령정보센터에서 보기
                    </button>
                  </Card>
                ))}
              </div>
            </div>

            {/* 추가 검토 항목 — 인터랙티브 글래스 */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">추가 검토 권고</p>
              <div className="space-y-2">
                {[
                  { icon: Building2, label: '주차장 설치 기준', desc: '연면적 기준 의무대수 산정' },
                  { icon: FileText, label: '건축허가 요건', desc: '건축법 제11조 검토 필요' },
                  { icon: MapPin, label: '도시계획시설 여부', desc: '도로·공원·학교 저촉 확인' },
                ].map(item => (
                  <button
                    key={item.label}
                    className="liquid-glass liquid-glass-interactive w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                  >
                    <div className="w-7 h-7 rounded-md liquid-glass-tint flex items-center justify-center shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* 법령 업데이트 안내 */}
        <div className="px-4 py-3 border-t border-[rgba(225,229,236,0.7)] shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            법령 데이터 최종 동기화: 2026. 4. 29.
          </div>
        </div>
      </aside>

    </div>
  );
}
