import React from 'react';

export default function StatusPanel({ player }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(max(8px, env(safe-area-inset-top)) + 40px)',
        left: 'max(8px, env(safe-area-inset-left))',
        background: 'rgba(0,0,0,0.35)',
        color: '#e0e0e0',
        border: '1px solid #222',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 13,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        pointerEvents: 'none',
        zIndex: 9,
      }}
    >
      <span>Life: 1</span>
      <span style={{ margin: '0 8px' }}>|</span>
      <span>FireRate: {player.fireRate.toFixed(1)}/s</span>
      <span style={{ margin: '0 8px' }}>|</span>
      <span>Damage: {player.damage}</span>
    </div>
  );
}

