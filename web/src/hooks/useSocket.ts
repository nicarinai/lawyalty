// apps/web/src/hooks/useSocket.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoomStatePayload {
  code: string;
  userCount: number;
}

interface UseSocketOptions {
  roomId: string;
  onRoomState?: (payload: RoomStatePayload) => void;
  onCodeUpdate?: (code: string) => void;
  onUserCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket({
  roomId,
  onRoomState,
  onCodeUpdate,
  onUserCount,
  onConnect,
  onDisconnect,
}: UseSocketOptions): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  const onRoomStateRef = useRef(onRoomState);
  const onCodeUpdateRef = useRef(onCodeUpdate);
  const onUserCountRef = useRef(onUserCount);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onRoomStateRef.current = onRoomState;
    onCodeUpdateRef.current = onCodeUpdate;
    onUserCountRef.current = onUserCount;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onRoomState, onCodeUpdate, onUserCount, onConnect, onDisconnect]);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    const client = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    const handleConnect = () => {
      onConnectRef.current?.();
      client.emit('room:join', roomId);
    };

    const handleDisconnect = () => {
      onDisconnectRef.current?.();
    };

    const handleRoomState = (payload: RoomStatePayload) => {
      onRoomStateRef.current?.(payload);
    };

    const handleCodeUpdate = (code: string) => {
      onCodeUpdateRef.current?.(code);
    };

    const handleUserCount = (count: number) => {
      onUserCountRef.current?.(count);
    };

    client.on('connect', handleConnect);
    client.on('disconnect', handleDisconnect);
    client.on('room:state', handleRoomState);
    client.on('code:update', handleCodeUpdate);
    client.on('room:userCount', handleUserCount);

    setSocket(client);

    return () => {
      client.off('connect', handleConnect);
      client.off('disconnect', handleDisconnect);
      client.off('room:state', handleRoomState);
      client.off('code:update', handleCodeUpdate);
      client.off('room:userCount', handleUserCount);
      client.disconnect();
      setSocket(null);
    };
  }, [roomId]);

  return socket;
}