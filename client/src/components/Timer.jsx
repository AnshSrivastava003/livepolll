// client/src/components/Timer.jsx
import React, { useEffect, useState } from "react";

/**
 * Props:
 *  - duration (seconds)
 *  - onTick(optional) receives seconds left
 *  - onEnd(optional) called when timer hits 0
 */
export default function Timer({ duration = 60, onTick, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onEnd) onEnd();
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        const nt = t - 1;
        if (onTick) onTick(nt);
        if (nt <= 0 && onEnd) onEnd();
        return nt;
      });
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, onEnd]);

  return (
    <div className="timer">
      ⏱ Time left: <strong>{timeLeft}s</strong>
    </div>
  );
}
