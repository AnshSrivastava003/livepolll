// server/server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

// --- app + http server
const app = express();
app.use(express.json());
const server = http.createServer(app);

// --- In-memory rooms
// Map<roomCode, roomObj>
const rooms = new Map();

// roomObj structure:
// {
//   code: 'ABC123',
//   question: 'Cats vs Dogs?',
//   votes: { optionA: 0, optionB: 0 },
//   voters: { username: 'optionA', ... },
//   clients: Set(ws),
//   usernames: Set(username strings),
//   votingOpen: true/false,
//   endsAt: timestamp (ms) or null,
//   timer: Node interval id or null
// }
function makeRoom(code, duration = 60) {
  const room = {
    code,
    question: "Cats vs Dogs?",
    votes: { optionA: 0, optionB: 0 },
    voters: {}, // username -> option
    clients: new Set(),
    usernames: new Set(),
    votingOpen: true,
    endsAt: null,
    timer: null,
  };
  rooms.set(code, room);
  startRoomTimer(room, duration);
  return room;
}

function roomExists(code) {
  return rooms.has(code);
}

function getTimeLeft(room) {
  if (!room.endsAt) return 0;
  const left = Math.max(0, Math.ceil((room.endsAt - Date.now()) / 1000));
  return left;
}

function roomState(room) {
  const total = room.votes.optionA + room.votes.optionB;
  return {
    type: "state",
    room: room.code,
    question: room.question,
    votes: room.votes,
    totalVotes: total,
    votingOpen: room.votingOpen,
    timeLeft: getTimeLeft(room),
    votersCount: Object.keys(room.voters).length,
  };
}

function broadcastRoom(roomCode, messageObj) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const payload = JSON.stringify(messageObj);
  for (const client of room.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function send(ws, obj) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
}

function generateRoomCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
}

function startRoomTimer(room, durationSec = 60) {
  // clear existing timer if any
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  room.votingOpen = true;
  room.endsAt = Date.now() + durationSec * 1000;

  // broadcast initial state
  broadcastRoom(room.code, roomState(room));

  room.timer = setInterval(() => {
    const left = getTimeLeft(room);
    // broadcast the time tick
    broadcastRoom(room.code, { type: "timer", timeLeft: left });

    if (left <= 0) {
      // voting ended
      room.votingOpen = false;
      clearInterval(room.timer);
      room.timer = null;
      // broadcast final state and ended event
      broadcastRoom(room.code, { type: "ended" });
      broadcastRoom(room.code, roomState(room));
      // optionally, you could schedule room cleanup later
    }
  }, 1000);
}

// --- HTTP endpoints for quick testing
app.get("/", (req, res) => {
  res.send("Live Poll Battle server running");
});

app.get("/room/:code", (req, res) => {
  const code = String(req.params.code).toUpperCase();
  if (!rooms.has(code)) {
    return res.status(404).json({ error: "Room not found" });
  }
  const room = rooms.get(code);
  return res.json(roomState(room));
});

// --- WebSocket server
const wss = new WebSocket.Server({ server });

// Map to track metadata for each websocket
// Map<ws, { username, roomCode }>
const wsMeta = new Map();

wss.on("connection", (ws) => {
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch (e) {
      send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    const t = data.type;

    // ---------- CREATE ----------
    // { type: 'create', room?: 'ABC123', duration?: 60, username?: 'Ansh' }
    if (t === "create") {
      const requested = data.room ? String(data.room).toUpperCase() : generateRoomCode();
      const code = requested;
      if (rooms.has(code)) {
        send(ws, { type: "error", message: "Room already exists" });
        return;
      }
      const duration = Number.isInteger(data.duration) ? data.duration : 60;
      const room = makeRoom(code, duration);
      send(ws, { type: "created", room: room.code, state: roomState(room) });

      // If the sender included a username, auto-join them
      if (data.username) {
        // handle as join below
        handleJoin(ws, { room: code, username: data.username });
      }
      return;
    }

    // ---------- JOIN ----------
    // { type: 'join', room: 'ABC123', username: 'Ansh' }
    if (t === "join") {
      handleJoin(ws, data);
      return;
    }

    // ---------- VOTE ----------
    // { type: 'vote', option: 'optionA' }
    if (t === "vote") {
      const meta = wsMeta.get(ws);
      if (!meta || !meta.roomCode) {
        send(ws, { type: "error", message: "You must join a room first" });
        return;
      }
      const room = rooms.get(meta.roomCode);
      if (!room) {
        send(ws, { type: "error", message: "Room not found" });
        return;
      }
      if (!room.votingOpen) {
        send(ws, { type: "error", message: "Voting is closed in this room" });
        return;
      }
      const username = meta.username;
      if (!username) {
        send(ws, { type: "error", message: "Missing username" });
        return;
      }
      const option = data.option;
      if (!["optionA", "optionB"].includes(option)) {
        send(ws, { type: "error", message: "Invalid vote option" });
        return;
      }
      if (room.voters[username]) {
        send(ws, { type: "error", message: "User has already voted" });
        return;
      }

      // record vote
      room.votes[option] = (room.votes[option] || 0) + 1;
      room.voters[username] = option;

      // broadcast new state
      broadcastRoom(room.code, { type: "vote_received", username, option });
      broadcastRoom(room.code, roomState(room));
      return;
    }

    // ---------- LEAVE ----------
    // { type: 'leave' }
    if (t === "leave") {
      handleLeave(ws);
      return;
    }

    // ---------- GET_STATE ----------
    // { type: 'get_state', room: 'ABC123' }
    if (t === "get_state") {
      const code = String(data.room || "").toUpperCase();
      if (!rooms.has(code)) {
        send(ws, { type: "error", message: "Room not found" });
        return;
      }
      const room = rooms.get(code);
      send(ws, roomState(room));
      return;
    }

    // unknown type
    send(ws, { type: "error", message: "Unknown message type" });
  });

  ws.on("close", () => {
    handleLeave(ws);
  });
});

// ---------- helpers for join/leave ----------
function handleJoin(ws, data) {
  const code = String(data.room || "").toUpperCase();
  const username = String(data.username || "").trim();

  if (!code) {
    send(ws, { type: "error", message: "Missing room code" });
    return;
  }
  if (!username) {
    send(ws, { type: "error", message: "Missing username" });
    return;
  }
  if (!rooms.has(code)) {
    send(ws, { type: "error", message: "Room not found" });
    return;
  }

  const room = rooms.get(code);

  // check if username already taken by connected user
  if (room.usernames.has(username)) {
    send(ws, { type: "error", message: "Username already taken in this room" });
    return;
  }

  // attach to room
  room.clients.add(ws);
  room.usernames.add(username);
  wsMeta.set(ws, { username, roomCode: code });

  // send joined + state to this client
  send(ws, { type: "joined", room: code, state: roomState(room) });

  // notify others in room
  broadcastRoom(code, { type: "user_joined", username, votersCount: Object.keys(room.voters).length });

  // also send updated state (so everyone sees new counts/time)
  broadcastRoom(code, roomState(room));
}

function handleLeave(ws) {
  const meta = wsMeta.get(ws);
  if (!meta) return;
  const { username, roomCode } = meta;
  const room = rooms.get(roomCode);
  if (room) {
    room.clients.delete(ws);
    room.usernames.delete(username);
    // don't remove votes or voters map on leave; votes persist for round
    broadcastRoom(roomCode, { type: "user_left", username, votersCount: Object.keys(room.voters).length });
    broadcastRoom(roomCode, roomState(room));
  }
  wsMeta.delete(ws);
}

// --- ping/pong keepalive and cleanup
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`HTTP server listening at http://localhost:${PORT}`);
  console.log(`WebSocket server listening at ws://localhost:${PORT}`);
});
