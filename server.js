// server.js
const WebSocket = require('ws');
const http = require('http');

const PORT = 3000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const users = new Map(); // ws -> { username, room }
const rooms = new Map(); // room -> Set of ws

function broadcast(room, data, exclude = null) {
  if (!rooms.has(room)) return;
  for (const client of rooms.get(room)) {
    if (client.readyState === WebSocket.OPEN && client !== exclude) {
      client.send(JSON.stringify(data));
    }
  }
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.error('Invalid message:', msg);
      return;
    }

    const user = users.get(ws);

    switch (data.type) {
      case 'set-username':
        if (
          Array.from(users.values()).some(
            (u) => u.username === data.username
          )
        ) {
          ws.send(JSON.stringify({ type: 'notification', text: 'Username already taken' }));
          ws.close();
          return;
        }
        users.set(ws, { username: data.username, room: null });
        break;

      case 'get-rooms':
        ws.send(JSON.stringify({ type: 'room-list', rooms: Array.from(rooms.keys()) }));
        break;

      case 'join-room':
        if (!data.room) return;
        if (user.room) {
          rooms.get(user.room)?.delete(ws);
          broadcast(user.room, { type: 'notification', text: `${user.username} left the room.` }, ws);
        }

        user.room = data.room;
        users.set(ws, user);

        if (!rooms.has(data.room)) {
          rooms.set(data.room, new Set());
        }

        rooms.get(data.room).add(ws);

        ws.send(JSON.stringify({ type: 'notification', text: `You joined room: ${data.room}` }));
        broadcast(data.room, { type: 'notification', text: `${user.username} joined the room.` }, ws);
        ws.send(JSON.stringify({ type: 'room-list', rooms: Array.from(rooms.keys()) }));
        break;

      case 'message':
        if (!user || !user.room || !data.content) return;
        const message = {
          type: 'message',
          message: {
            username: user.username,
            content: data.content,
            timestamp: new Date().toISOString(),
          },
        };
        broadcast(user.room, message);
        break;
    }
  });

  ws.on('close', () => {
    const user = users.get(ws);
    if (user?.room) {
      rooms.get(user.room)?.delete(ws);
      broadcast(user.room, {
        type: 'notification',
        text: `${user.username} disconnected.`,
      });
    }
    users.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
