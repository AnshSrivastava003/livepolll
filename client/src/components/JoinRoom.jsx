// client/src/components/JoinRoom.jsx
import React, { useState } from "react";

function generateCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
}

export default function JoinRoom({ onJoin }) {
  const [localName, setLocalName] = useState("");
  const [localRoom, setLocalRoom] = useState("");

  const handleCreate = () => {
    if (!localName.trim()) {
      alert("Please enter your name first");
      return;
    }
    const newCode = generateCode();
    setLocalRoom(newCode);
    onJoin(localName.trim(), newCode, "create");
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const name = localName.trim();
    const room = localRoom.trim().toUpperCase();
    if (!name) return alert("Please enter your name");
    if (!room) return alert("Please enter a room code");
    onJoin(name, room, "join");
  };

  return (
    <div>
      <div className="header">
        <div>
          <div className="title">Live Poll Battle</div>
          <div className="subtitle">
            Create or join a room and vote live — 60s rounds
          </div>
        </div>
        <div className="note">No password required</div>
      </div>

      <form onSubmit={handleJoin}>
        <div className="form-row">
          <input
            className="input"
            placeholder="Your name (e.g. Ansh)"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />
        </div>

        <div className="form-row">
          <input
            className="small-input"
            placeholder="Room code"
            value={localRoom}
            onChange={(e) => setLocalRoom(e.target.value.toUpperCase())}
          />
          <button type="button" className="btn ghost" onClick={handleCreate}>
            Create
          </button>
          <button type="submit" className="btn">
            Join
          </button>
        </div>

        <div className="note">
          Tip: click <strong>Create</strong> to generate a short room code and
          start a poll — share it with friends.
        </div>
      </form>
    </div>
  );
}
