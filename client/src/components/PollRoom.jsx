// client/src/components/PollRoom.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Timer from "./Timer";
import ProgressBar from "./ProgressBar";

export default function PollRoom({ username, roomCode, mode, onLeave }) {
  const wsRef = useRef(null);

  const [votes, setVotes] = useState({ optionA: 0, optionB: 0 });
  const [selected, setSelected] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [votingOpen, setVotingOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);

  // connect WebSocket on mount
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      if (mode === "create") {
        ws.send(
          JSON.stringify({
            type: "create",
            room: roomCode,
            duration: 60,
            username: username,
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "join",
            room: roomCode,
            username: username,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("📩 from server:", msg);

      if (msg.type === "state") {
        setVotes(msg.votes);
        setVotingOpen(msg.votingOpen);
        setTimeLeft(msg.timeLeft);
      }
      if (msg.type === "vote_received") {
        // could show toast if needed
      }
      if (msg.type === "ended") {
        setVotingOpen(false);
      }
      if (msg.type === "error") {
        alert("Server error: " + msg.message);
      }
    };

    ws.onclose = () => {
      console.log("🔴 disconnected from server");
    };

    return () => {
      ws.close();
    };
  }, [roomCode, username, mode]);

  // check localStorage (persisted vote)
  useEffect(() => {
    const stored = localStorage.getItem(`vote-${roomCode}-${username}`);
    if (stored) {
      setSelected(stored);
      setHasVoted(true);
    }
  }, [roomCode, username]);

  const handleVote = (option) => {
    if (!votingOpen || hasVoted) return;
    setSelected(option);
    setHasVoted(true);
    localStorage.setItem(`vote-${roomCode}-${username}`, option);

    wsRef.current?.send(
      JSON.stringify({
        type: "vote",
        option,
      })
    );
  };

  const total = useMemo(() => votes.optionA + votes.optionB, [votes]);
  const percentA = total ? Math.round((votes.optionA / total) * 100) : 0;
  const percentB = total ? Math.round((votes.optionB / total) * 100) : 0;

  return (
    <div>
      <div className="header">
        <div>
          <div className="title">Room: {roomCode}</div>
          <div className="subtitle">Hello, {username}</div>
        </div>
        <button
          className="btn ghost"
          onClick={() => {
            wsRef.current?.send(JSON.stringify({ type: "leave" }));
            onLeave();
          }}
        >
          Leave
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700 }}>Question: Cats vs Dogs?</div>
        <Timer duration={timeLeft} />
      </div>

      <div className={`poll-grid ${!votingOpen ? "closed" : ""}`}>
        <div className="option-card">
          <button
            className={`option-btn ${selected === "optionA" ? "selected" : ""}`}
            onClick={() => handleVote("optionA")}
            disabled={!votingOpen || hasVoted}
          >
            🐱 Cats
          </button>
          <div className="meta">
            <div style={{ fontSize: 14, fontWeight: 700 }}>{votes.optionA} votes</div>
            <div style={{ color: "#475569" }}>{percentA}%</div>
          </div>
          <ProgressBar
            percent={percentA}
            color="linear-gradient(90deg,#60a5fa,#06b6d4)"
          />
        </div>

        <div className="option-card">
          <button
            className={`option-btn ${selected === "optionB" ? "selected" : ""}`}
            onClick={() => handleVote("optionB")}
            disabled={!votingOpen || hasVoted}
          >
            🐶 Dogs
          </button>
          <div className="meta">
            <div style={{ fontSize: 14, fontWeight: 700 }}>{votes.optionB} votes</div>
            <div style={{ color: "#475569" }}>{percentB}%</div>
          </div>
          <ProgressBar
            percent={percentB}
            color="linear-gradient(90deg,#fdba74,#fb7185)"
          />
        </div>
      </div>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        {!votingOpen ? (
          <div style={{ color: "var(--muted)", fontWeight: 600 }}>
            Voting closed • Final results above
          </div>
        ) : hasVoted ? (
          <div style={{ color: "var(--muted)", fontWeight: 600 }}>
            Thanks for voting — results update live
          </div>
        ) : (
          <div className="note">
            You have <strong>{timeLeft}s</strong> to vote.
          </div>
        )}
      </div>
    </div>
  );
}
