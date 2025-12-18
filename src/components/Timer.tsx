'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  isRunning: boolean;
  onStop?: () => void;
}

export default function Timer({ isRunning, onStop }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white px-6 py-3 rounded-lg shadow-lg">
      <div className="text-3xl font-bold text-center">
        ⏱ {formatTime(seconds)}
      </div>
    </div>
  );
}

