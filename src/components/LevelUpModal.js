import React from 'react';

export default function LevelUpModal({ options, onChoose }) {
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', pointerEvents: 'auto' }}>
      <div style={{ background: '#121212', color: '#e0e0e0', padding: 16, borderRadius: 10, border: '1px solid #333', minWidth: 320 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Level Up</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {options.map(opt => (
            <button key={opt} onClick={() => onChoose(opt)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #444', background: '#1c1c1c', color: '#e0e0e0', cursor: 'pointer', textAlign: 'left' }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

