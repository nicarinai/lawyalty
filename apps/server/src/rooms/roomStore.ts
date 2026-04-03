export interface Room {
  code: string;
  users: Set<string>;
  updatedAt: number;
}

const rooms = new Map<string, Room>();

const DEFAULT_CODE = `flowchart TD
    A([🚀 Start]) --> B{Logged In?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Login Screen]
    C --> E[Fetch User Data]
    D --> F[Auth Success]
    F --> C
    E --> G([✅ End])`;

export function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      code: DEFAULT_CODE,
      users: new Set(),
      updatedAt: Date.now(),
    });
    console.log(`[room] created: ${roomId}`);
  }
  return rooms.get(roomId)!;
}

export function updateRoomCode(roomId: string, code: string): void {
  const room = getOrCreateRoom(roomId);
  room.code = code;
  room.updatedAt = Date.now();
}

export function addUser(roomId: string, socketId: string): void {
  const room = getOrCreateRoom(roomId);
  room.users.add(socketId);
}

export function removeUser(roomId: string, socketId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.users.delete(socketId);
    // Clean up empty rooms after 10 min of inactivity (simple GC)
    if (room.users.size === 0) {
      setTimeout(() => {
        const r = rooms.get(roomId);
        if (r && r.users.size === 0) {
          rooms.delete(roomId);
          console.log(`[room] cleaned up: ${roomId}`);
        }
      }, 10 * 60 * 1000);
    }
  }
}

export function getUserCount(roomId: string): number {
  return rooms.get(roomId)?.users.size ?? 0;
}

export function getRoomCode(roomId: string): string {
  return rooms.get(roomId)?.code ?? DEFAULT_CODE;
}
