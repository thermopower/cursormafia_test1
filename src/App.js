import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import StatusPanel from './components/StatusPanel';
import LevelUpModal from './components/LevelUpModal';
import GameOverScreen from './components/GameOverScreen';
import VirtualJoystick from './components/VirtualJoystick';

import useInput from './hooks/useInput';
import useGameLoop from './hooks/useGameLoop';

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 600;

function useViewport() {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  useEffect(() => {
    let t = 0;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => { setVw(window.innerWidth); setVh(window.innerHeight); }, 100); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize); };
  }, []);
  return { vw, vh };
}

function computeLayout(vw, vh) {
  const scale = Math.min(vw / LOGICAL_WIDTH, vh / LOGICAL_HEIGHT);
  const cssWidth = Math.round(LOGICAL_WIDTH * scale);
  const cssHeight = Math.round(LOGICAL_HEIGHT * scale);
  const offsetLeft = Math.floor((vw - cssWidth) / 2);
  // bottom-align (mobile friendly). Still works on desktop.
  const safeBottom = 0; // env(safe-area-inset-bottom) not directly accessible here
  const offsetTop = Math.max(vh - cssHeight - safeBottom, 0);
  return { scale, cssWidth, cssHeight, offsetLeft, offsetTop };
}

export default function App() {
  const { vw, vh } = useViewport();
  const layout = useMemo(() => computeLayout(vw, vh), [vw, vh]);

  const { vector, setExternalVector } = useInput();
  const { state, applyUpgrade, restart } = useGameLoop({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, inputVector: vector });

  // Joystick UI state
  const [joy, setJoy] = useState({ visible: false, center: null, knob: { dx: 0, dy: 0 } });
  const activePointerId = useRef(null);

  const toVector = useCallback((clientX, clientY) => {
    if (!joy.center) return { x: 0, y: 0 };
    // Work in CSS pixel space; we want joystick radius ~50px
    const dx = clientX - joy.center.x;
    const dy = clientY - joy.center.y;
    const r = Math.hypot(dx, dy);
    const maxR = 50;
    const k = r > maxR ? maxR / r : 1;
    const ndx = dx * k;
    const ndy = dy * k;
    const m = Math.hypot(ndx, ndy) || 1;
    return { vec: { x: ndx / m, y: ndy / m }, knob: { dx: ndx, dy: ndy } };
  }, [joy.center]);

  // Pointer handlers for joystick
  const onPointerDown = useCallback((e) => {
    // Only allow one active pointer for control
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
    const cx = e.clientX; const cy = e.clientY;
    setJoy({ visible: true, center: { x: cx, y: cy }, knob: { dx: 0, dy: 0 } });
    setExternalVector({ x: 0, y: 0 });
  }, [setExternalVector]);

  const onPointerMove = useCallback((e) => {
    if (activePointerId.current !== e.pointerId || !joy.center) return;
    e.preventDefault();
    const { vec, knob } = toVector(e.clientX, e.clientY);
    setJoy((j) => ({ ...j, knob }));
    setExternalVector(vec);
  }, [joy.center, setExternalVector, toVector]);

  const onPointerUp = useCallback((e) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    activePointerId.current = null;
    setJoy({ visible: false, center: null, knob: { dx: 0, dy: 0 } });
    setExternalVector({ x: 0, y: 0 });
  }, [setExternalVector]);

  return (
    <div className="GameRoot" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="GameStage" style={{ width: layout.cssWidth, height: layout.cssHeight }}>
        <GameCanvas width={LOGICAL_WIDTH} height={LOGICAL_HEIGHT} cssScale={layout.scale} state={state} />
        <HUD score={state.score} elapsed={state.elapsed} />
        <StatusPanel player={state.player} />
        <VirtualJoystick visible={joy.visible} center={joy.center} knob={joy.knob} />
        {state.levelUp.open && (
          <LevelUpModal options={state.levelUp.options} onChoose={applyUpgrade} />
        )}
        {state.gameOver && (
          <GameOverScreen score={state.score} kills={state.kills} elapsed={state.elapsed} onRestart={restart} />
        )}
      </div>
    </div>
  );
}
