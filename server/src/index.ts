import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerRoomHandlers } from './socket/roomHandlers';

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  // Efficient transport; fall back to polling if WS not available
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log(`[socket] connected  : ${socket.id}`);
  registerRoomHandlers(io, socket);
  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} — ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🌙 Midnight Mermaid server`);
  console.log(`   http://localhost:${PORT}\n`);
});
