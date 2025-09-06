// client/src/App.jsx
import React, { useState } from "react";
import JoinRoom from "./components/JoinRoom";
import PollRoom from "./components/PollRoom";

export default function App() {
  const [user, setUser] = useState(null);

  const handleJoin = (username, roomCode, mode) => {
    setUser({ username, roomCode, mode });
  };

  const handleLeave = () => setUser(null);

  return (
    <div className="app-card">
      {!user ? (
        <JoinRoom onJoin={handleJoin} />
      ) : (
        <PollRoom
          username={user.username}
          roomCode={user.roomCode}
          mode={user.mode}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
