import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import StatusPanel from './components/StatusPanel';
import LevelUpModal from './components/LevelUpModal';
import GameOverScreen from './components/GameOverScreen';
import VirtualJoystick from './components/VirtualJoystick';
import useGameLoop from './hooks/useGameLoop';
import useInput from './hooks/useInput';

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 600;
const JOY_RADIUS = 50;

export default function App() {
  const { vector, setExternalVector } = useInput();
  const game = useGameLoop({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, inputVector: vector });

  // responsive contain scaling to fit viewport while preserving aspect
  const [cssSize, setCssSize] = useState({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, left: 0, top: 0, scale: 1 });
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / LOGICAL_WIDTH, vh / LOGICAL_HEIGHT);
      const width = Math.round(LOGICAL_WIDTH * scale);
      const height = Math.round(LOGICAL_HEIGHT * scale);
      const left = Math.floor((vw - width) / 2);
      const top = Math.floor((vh - height) / 2);
      setCssSize({ width, height, left, top, scale });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(document.documentElement);
    window.addEventListener('orientationchange', compute);
    return () => { ro.disconnect(); window.removeEventListener('orientationchange', compute); };
  }, []);

  // mobile joystick: one-touch drag with Pointer Events
  const isMobile = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const [joyVisible, setJoyVisible] = useState(false);
  const [joyCenter, setJoyCenter] = useState({ x: 60, y: 60 });
  const [joyKnob, setJoyKnob] = useState({ dx: 0, dy: 0 });
  const activePointer = useRef(null);

  const clampVec = (dx, dy, r) => {
    const m = Math.hypot(dx, dy) || 1;
    const c = Math.min(m, r);
    return { dx: (dx / m) * c, dy: (dy / m) * c };
  };
  const toLogical = useCallback((clientX, clientY) => {
    const x = (clientX - cssSize.left) / cssSize.scale;
    const y = (clientY - cssSize.top) / cssSize.scale;
    return { x, y };
  }, [cssSize.left, cssSize.scale, cssSize.top]);
  const onPointerDown = useCallback((e) => {
    if (!isMobile) return;
    if (game.state.levelUp.open || game.state.gameOver) return;
    e.preventDefault();
    const { x, y } = toLogical(e.clientX, e.clientY);
    setJoyCenter({ x, y });
    setJoyVisible(true);
    activePointer.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const dx0 = (e.clientX - cssSize.left) / cssSize.scale - x;
    const dy0 = (e.clientY - cssSize.top) / cssSize.scale - y;
    const { dx, dy } = clampVec(dx0, dy0, JOY_RADIUS);
    setJoyKnob({ dx, dy });
    setExternalVector({ x: dx / JOY_RADIUS, y: dy / JOY_RADIUS });
  }, [cssSize.left, cssSize.scale, game.state.gameOver, game.state.levelUp.open, isMobile, setExternalVector, toLogical]);
  const onPointerMove = useCallback((e) => {
    if (!isMobile) return; if (activePointer.current !== e.pointerId) return; if (!joyVisible) return;
    e.preventDefault();
    const p = toLogical(e.clientX, e.clientY);
    const dx0 = p.x - joyCenter.x; const dy0 = p.y - joyCenter.y;
    const { dx, dy } = clampVec(dx0, dy0, JOY_RADIUS);
    setJoyKnob({ dx, dy });
    setExternalVector({ x: dx / JOY_RADIUS, y: dy / JOY_RADIUS });
  }, [isMobile, joyCenter.x, joyCenter.y, joyVisible, setExternalVector, toLogical]);
  const endPointer = useCallback((e) => {
    if (activePointer.current !== e.pointerId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    activePointer.current = null;
    setJoyVisible(false);
    setJoyKnob({ dx: 0, dy: 0 });
    setExternalVector({ x: 0, y: 0 });
  }, [setExternalVector]);

  const outerStyle = useMemo(() => ({
    position: 'relative', width: '100vw', height: '100vh', background: '#000', touchAction: 'none', userSelect: 'none', overscrollBehavior: 'none'
  }), []);
  const innerStyle = useMemo(() => ({
    position: 'absolute', width: cssSize.width, height: cssSize.height, left: cssSize.left, top: cssSize.top,
  }), [cssSize.height, cssSize.left, cssSize.top, cssSize.width]);
  const showJoystick = isMobile && joyVisible && !game.state.levelUp.open && !game.state.gameOver;

  return (
    <div className="App" style={outerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div style={innerStyle}>
        <GameCanvas width={LOGICAL_WIDTH} height={LOGICAL_HEIGHT} cssScale={cssSize.scale} state={game.state} />
        <HUD score={game.state.score} elapsed={game.state.elapsed} />
        <StatusPanel player={game.state.player} />
        {game.state.levelUp.open && (
          <LevelUpModal options={game.state.levelUp.options} onChoose={game.applyUpgrade} />
        )}
        {game.state.gameOver && (
          <GameOverScreen score={game.state.score} kills={game.state.kills} elapsed={game.state.elapsed} onRestart={game.restart} />
        )}
        <VirtualJoystick visible={showJoystick} center={joyCenter} knob={joyKnob} />
      </div>
    </div>
  );
}
