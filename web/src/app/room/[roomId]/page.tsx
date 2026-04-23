'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

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

export default function RoomPage() {
  const params = useParams();
  const rawRoomId = Array.isArray(params?.roomId)
    ? params.roomId[0]
    : params?.roomId;

  if (!rawRoomId || typeof rawRoomId !== 'string') {
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-text">
        <span className="font-mono text-sm">Loading room…</span>
      </div>
    );
  }

  const roomId = decodeURIComponent(rawRoomId).toUpperCase();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [userCount, setUserCount] = useState(1);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [connected, setConnected] = useState(false);

  const socket = useSocket({
    roomId,
    onRoomState: ({ code: roomCode, userCount: count }) => {
      setCode(roomCode);
      setUserCount(count);
      setConnected(true);
    },
    onCodeUpdate: (newCode: string) => setCode(newCode),
    onUserCount: (count: number) => setUserCount(count),
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

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
      {/* 지금 쓰고 있는 header / main / footer JSX 그대로 */}
    </div>
  );
}