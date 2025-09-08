import React from 'react';

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function GameOverScreen({ score, kills, elapsed, onRestart }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', pointerEvents: 'auto' }}>
      <div style={{ background: '#121212', color: '#e0e0e0', padding: 16, borderRadius: 10, border: '1px solid #333', minWidth: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Game Over</div>
        <div style={{ marginBottom: 8 }}>Final Score: {score}</div>
        <div style={{ marginBottom: 8 }}>Kills: {kills}</div>
        <div style={{ marginBottom: 12 }}>Time: {formatTime(elapsed)}</div>
        <button onClick={onRestart} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #444', background: '#1c1c1c', color: '#e0e0e0', cursor: 'pointer' }}>Restart</button>
      </div>
    </div>
  );
}

