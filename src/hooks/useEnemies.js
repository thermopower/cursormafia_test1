import { useMemo, useRef } from 'react';

function rand(min, max) { return Math.random() * (max - min) + min; }

export default function useEnemies({ width, height }) {
  const listRef = useRef([]);
  const lastSpawnRef = useRef(0);
  const spawnIntervalRef = useRef(1.2);
  const killsRef = useRef(0);
  const nextBossAtRef = useRef(50);

  return useMemo(() => ({
    list: () => listRef.current,
    kills: () => killsRef.current,
    spawnIfDue: (t) => {
      if (t - lastSpawnRef.current >= spawnIntervalRef.current) {
        lastSpawnRef.current = t;
        const edge = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (edge === 0) { x = rand(0, width); y = -20; }
        else if (edge === 1) { x = width + 20; y = rand(0, height); }
        else if (edge === 2) { x = rand(0, width); y = height + 20; }
        else { x = -20; y = rand(0, height); }
        listRef.current.push({ id: `e_${Math.random().toString(36).slice(2)}`, pos: { x, y }, speed: rand(45, 85), boss: false, hp: 2 });
        spawnIntervalRef.current = Math.max(0.5, spawnIntervalRef.current * 0.998);
      }
    },
    maybeSpawnBoss: () => {
      if (killsRef.current >= nextBossAtRef.current) {
        nextBossAtRef.current += 50;
        listRef.current.push({ id: `b_${Math.random().toString(36).slice(2)}`, pos: { x: width / 2, y: -40 }, speed: 50, boss: true, hp: 25 });
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
    clear: () => { listRef.current = []; killsRef.current = 0; lastSpawnRef.current = 0; spawnIntervalRef.current = 1.2; nextBossAtRef.current = 50; },
  }), [height, width]);
}

