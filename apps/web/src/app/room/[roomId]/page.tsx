'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from '@/hooks/useSocket';

// Dynamically import heavy client-only components to avoid SSR
const EditorPanel = dynamic(() => import('@/components/EditorPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-panel">
      <span className="text-subtle font-mono text-xs animate-pulse">Loading editor…</span>
    </div>
  ),
});

const DiagramPreview = dynamic(() => import('@/components/DiagramPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-subtle font-mono text-xs animate-pulse">Initialising renderer…</span>
    </div>
  ),
});

const DEFAULT_CODE = `flowchart TD
    A([🚀 Start]) --> B{Logged In?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Login Screen]
    C --> E[Fetch User Data]
    D --> F[Auth Success]
    F --> C
    E --> G([✅ End])`;

interface RoomPageProps {
  params: { roomId: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const roomId = decodeURIComponent(params.roomId).toUpperCase();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [userCount, setUserCount] = useState(1);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [connected, setConnected] = useState(false);

  // Socket connection and event handling
  const socket = useSocket({
    roomId,
    onRoomState: ({ code: roomCode, userCount: count }) => {
      setCode(roomCode);
      setUserCount(count);
      setConnected(true);
    },
    onCodeUpdate: (newCode: string) => {
      setCode(newCode);
    },
    onUserCount: (count: number) => {
      setUserCount(count);
    },
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  // Emit code changes to other room members
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      if (socket && connected) {
        socket.emit('code:update', { roomId, code: newCode });
      }
    },
    [socket, connected, roomId]
  );

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).catch(() => {});
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-border bg-[#0a0a0a] shrink-0 z-20">
        {/* Left: brand + room */}
        <div className="flex items-center gap-5">
          <span className="text-accent font-bold tracking-tight text-sm">
            🌙 Midnight Mermaid
          </span>
          <button
            onClick={copyRoomCode}
            title="Click to copy room code"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated border border-border hover:border-accent/40 transition-colors"
          >
            <span className="text-[10px] font-mono text-subtle uppercase tracking-widest">room</span>
            <span className="text-[11px] font-mono font-semibold text-accent tracking-widest">
              #{roomId}
            </span>
            <svg className="w-3 h-3 text-muted ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Right: status badges */}
        <div className="flex items-center gap-4">
          {/* User count */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] font-mono text-dim">{userCount}</span>
            <span className="text-[10px] font-mono text-muted">online</span>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green glow-green' : 'bg-error'}`} />
            <span className={`text-[10px] font-mono uppercase tracking-widest ${connected ? 'text-green' : 'text-error'}`}>
              {connected ? 'Live' : 'Reconnecting'}
            </span>
          </div>

          {/* Toggle editor */}
          <button
            onClick={() => setEditorCollapsed(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated border border-border hover:border-accent/40 transition-colors text-dim hover:text-accent"
            title={editorCollapsed ? 'Show editor' : 'Hide editor'}
          >
            {editorCollapsed ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span className="text-[10px] font-mono">Editor</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10" /></svg>
                <span className="text-[10px] font-mono">Diagram only</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code editor pane */}
        {!editorCollapsed && (
          <div className="w-[42%] min-w-[280px] flex flex-col border-r border-border bg-panel animate-fade-in">
            {/* Editor title bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#111] shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] font-mono text-subtle uppercase tracking-widest">
                  flowchart.mmd
                </span>
              </div>
              <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
                mermaid
              </span>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-hidden">
              <EditorPanel code={code} onChange={handleCodeChange} />
            </div>
          </div>
        )}

        {/* Diagram preview pane */}
        <div className="flex-1 overflow-hidden relative dot-grid">
          <DiagramPreview code={code} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <footer className="flex items-center justify-between px-5 h-7 border-t border-border bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-5">
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            room #{roomId}
          </span>
          <span className="text-[9px] font-mono text-muted">·</span>
          <span className="text-[9px] font-mono text-subtle">
            {userCount} {userCount === 1 ? 'collaborator' : 'collaborators'}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            Midnight Mermaid MVP
          </span>
        </div>
      </footer>
    </div>
  );
}
