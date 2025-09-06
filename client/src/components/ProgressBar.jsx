// client/src/components/ProgressBar.jsx
import React from "react";

export default function ProgressBar({ percent, color }) {
  const style = {
    width: `${Math.max(0, Math.min(100, percent))}%`,
    background: color || "linear-gradient(90deg,#3b82f6,#06b6d4)",
  };
  return (
    <div className="progress-wrap" aria-hidden>
      <div className="progress" style={style}></div>
    </div>
  );
}
