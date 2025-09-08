import { useCallback, useEffect, useRef, useState } from 'react';

export default function useInput() {
  const [vector, setVector] = useState({ x: 0, y: 0 });
  const keysRef = useRef({});
  const extRef = useRef({ x: 0, y: 0 });

  const compute = useCallback(() => {
    const k = keysRef.current; let x = 0, y = 0;
    if (k['KeyA'] || k['ArrowLeft']) x -= 1;
    if (k['KeyD'] || k['ArrowRight']) x += 1;
    if (k['KeyW'] || k['ArrowUp']) y -= 1;
    if (k['KeyS'] || k['ArrowDown']) y += 1;
    x += extRef.current.x; y += extRef.current.y;
    const m = Math.hypot(x, y) || 1; setVector({ x: x / m, y: y / m });
  }, []);

  useEffect(() => {
    const down = (e) => { keysRef.current[e.code] = true; compute(); };
    const up = (e) => { keysRef.current[e.code] = false; compute(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [compute]);

  const setExternalVector = useCallback((v) => { extRef.current = v || { x: 0, y: 0 }; compute(); }, [compute]);

  return { vector, setExternalVector };
}

