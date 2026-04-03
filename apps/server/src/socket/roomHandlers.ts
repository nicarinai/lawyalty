import { Server, Socket } from 'socket.io';
import {
  addUser,
  removeUser,
  getOrCreateRoom,
  updateRoomCode,
  getUserCount,
} from '../rooms/roomStore';

export function registerRoomHandlers(io: Server, socket: Socket) {
  // Client joins a room by roomId
  socket.on('room:join', (roomId: string) => {
    if (typeof roomId !== 'string' || !roomId.trim()) return;

    socket.join(roomId);
    addUser(roomId, socket.id);

    const room = getOrCreateRoom(roomId);
    const count = getUserCount(roomId);

    console.log(`[room] ${socket.id} joined "${roomId}" (${count} users)`);

    // Send current room state to the joining client
    socket.emit('room:state', {
      code: room.code,
      userCount: count,
    });

    // Notify everyone in the room (including the new user) of updated count
    io.to(roomId).emit('room:userCount', count);
  });

  // Client sends a code update; broadcast to other room members
  socket.on(
    'code:update',
    ({ roomId, code }: { roomId: string; code: string }) => {
      if (typeof roomId !== 'string' || typeof code !== 'string') return;

      updateRoomCode(roomId, code);
      // Broadcast to everyone EXCEPT the sender (sender already has the update)
      socket.to(roomId).emit('code:update', code);
    }
  );

  // Clean up when a socket disconnects
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue; // skip the default self-room
      removeUser(roomId, socket.id);
      const count = getUserCount(roomId);
      io.to(roomId).emit('room:userCount', count);
      console.log(`[room] ${socket.id} left "${roomId}" (${count} users remaining)`);
    }
  });
}
