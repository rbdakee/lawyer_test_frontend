'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  isRunning?: boolean;
  onStop?: () => void;
}

export default function Timer({ seconds, isRunning, onStop }: TimerProps) {

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
    <div className="timer bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg w-full md:w-auto">
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-center whitespace-nowrap">
        ⏱ {formatTime(seconds)}
      </div>
    </div>
  );
}

