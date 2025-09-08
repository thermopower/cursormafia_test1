import { useMemo, useRef } from 'react';

function rand(min, max) { return Math.random() * (max - min) + min; }

export default function useEnemies({ width, height }) {
  const listRef = useRef([]);
  const lastSpawnAtRef = useRef(0); // game-time seconds
  const killsRef = useRef(0);
  const nextBossAtRef = useRef(60); // seconds

  const spawnIntervalFor = (elapsed) => Math.max(0.4, 1.2 * Math.pow(0.9, Math.floor(elapsed / 10)));

  return useMemo(() => ({
    list: () => listRef.current,
    kills: () => killsRef.current,
    spawnIfDue: (elapsed, playerPos) => {
      const interval = spawnIntervalFor(elapsed);
      if (elapsed - lastSpawnAtRef.current >= interval && listRef.current.length < 50) {
        lastSpawnAtRef.current = elapsed;
        let x = 0, y = 0; let ok = false; let attempts = 0;
        while (!ok && attempts++ < 8) {
          const edge = Math.floor(Math.random() * 4);
          if (edge === 0) { x = rand(0, width); y = -30; }
          else if (edge === 1) { x = width + 30; y = rand(0, height); }
          else if (edge === 2) { x = rand(0, width); y = height + 30; }
          else { x = -30; y = rand(0, height); }
          const px = playerPos?.x ?? width / 2; const py = playerPos?.y ?? height / 2;
          ok = Math.hypot(px - x, py - y) >= 120;
        }
        listRef.current.push({ id: `e_${Math.random().toString(36).slice(2)}`, pos: { x, y }, speed: rand(70, 90), boss: false, hp: 1 });
      }
    },
    maybeSpawnBoss: (elapsedSeconds) => {
      if (elapsedSeconds >= nextBossAtRef.current && !listRef.current.some(e => e.boss)) {
        nextBossAtRef.current = Infinity; // one-time spawn at 60s
        listRef.current.push({ id: `b_${Math.random().toString(36).slice(2)}`, pos: { x: width / 2, y: -40 }, speed: 60, boss: true, hp: 10 });
      }
    },
    steerTowards: (target, dt) => {
      for (const e of listRef.current) {
        const dx = target.x - e.pos.x; const dy = target.y - e.pos.y; const m = Math.hypot(dx, dy) || 1;
        e.pos.x += (dx / m) * e.speed * dt; e.pos.y += (dy / m) * e.speed * dt;
      }
    },
    hit: (id, dmg) => {
      const idx = listRef.current.findIndex(e => e.id === id); if (idx < 0) return 0;
      const e = listRef.current[idx]; e.hp -= dmg;
      if (e.hp <= 0) { const boss = e.boss; listRef.current.splice(idx, 1); killsRef.current += 1; return boss ? 5 : 1; }
      return 0;
    },
    clear: () => { listRef.current = []; killsRef.current = 0; lastSpawnAtRef.current = 0; nextBossAtRef.current = 60; },
  }), [height, width]);
}

