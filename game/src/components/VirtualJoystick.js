import React from 'react';

// Presentational joystick only. App handles pointer events and computes knob offsets.
export default function VirtualJoystick({ visible, center, knob }) {
  if (!visible) return null;
  const radius = 50;
  const left = Math.max(0, (center?.x || 60) - 60);
  const top = Math.max(0, (center?.y || 60) - 60);
  const localKnobX = 60 + (knob?.dx || 0);
  const localKnobY = 60 + (knob?.dy || 0);
  return (
    <div style={{ position: 'absolute', left, top, width: 120, height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #222', pointerEvents: 'none' }}>
      <svg width="120" height="120">
        <circle cx={60} cy={60} r={radius} fill="#101010" stroke="#2a2a2a" />
        <circle cx={60} cy={60} r={2} fill="#555" />
        <circle cx={localKnobX} cy={localKnobY} r={16} fill="#444" stroke="#777" />
      </svg>
    </div>
  );
}

