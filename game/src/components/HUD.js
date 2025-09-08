import React from 'react';

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function HUD({ score, elapsed }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(8px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.35)',
        color: '#e0e0e0',
        border: '1px solid #222',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 14,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <strong>Score:</strong> {score} &nbsp;|&nbsp; <strong>Time:</strong> {formatTime(elapsed)}
    </div>
  );
}

