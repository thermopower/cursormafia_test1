import { useMemo, useRef } from 'react';

export default function useProjectiles() {
  const listRef = useRef([]);

  return useMemo(() => ({
    list: () => listRef.current,
    spawnVolley: ({ origin, count, speed, damage }, dir) => {
      const n = Math.max(1, count | 0);
      const base = Math.atan2(dir.y, dir.x);
      const spread = Math.min(Math.PI / 4, 0.1 * n);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1);
        const ang = base - spread / 2 + spread * t;
        listRef.current.push({ id: `p_${Math.random().toString(36).slice(2)}`, pos: { ...origin }, vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed }, damage, ttl: 1.8 });
      }
    },
    step: (dt, bounds) => {
      listRef.current = listRef.current.filter(p => {
        p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt;
        p.ttl -= dt;
        const inBounds = p.pos.x >= -30 && p.pos.x <= bounds.width + 30 && p.pos.y >= -30 && p.pos.y <= bounds.height + 30;
        return p.ttl > 0 && inBounds;
      });
    },
    remove: (id) => { const i = listRef.current.findIndex(p => p.id === id); if (i >= 0) listRef.current.splice(i, 1); },
    clear: () => { listRef.current = []; },
  }), []);
}

