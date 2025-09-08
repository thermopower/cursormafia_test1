import { useMemo, useRef } from 'react';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export default function usePlayer({ width, height }) {
  const ref = useRef({
    pos: { x: width / 2, y: height / 2 },
    speed: 200,
    level: 1,
    xp: 0,
    fireRate: 2, // per second
    damage: 1,
    projectileSpeed: 420,
    projectileCount: 1,
    lastShotAt: 0,
  });

  return useMemo(() => ({
    get: () => ref.current,
    move: (dx, dy, dt) => {
      const p = ref.current;
      p.pos.x = clamp(p.pos.x + dx * p.speed * dt, 0, width);
      p.pos.y = clamp(p.pos.y + dy * p.speed * dt, 0, height);
    },
    canShoot: (t) => (t - ref.current.lastShotAt) >= (1 / ref.current.fireRate),
    markShot: (t) => { ref.current.lastShotAt = t; },
    addXP: (n) => { ref.current.xp += n; },
    thresholdReached: () => {
      const idx = ref.current.level - 1; const base = [10, 20, 40, 80, 160, 320];
      const thr = base[idx] || base[base.length - 1] * 2; return ref.current.xp >= thr;
    },
    levelUp: () => {
      const idx = ref.current.level - 1; const base = [10, 20, 40, 80, 160, 320];
      const thr = base[idx] || base[base.length - 1] * 2; ref.current.xp -= thr; ref.current.level += 1;
    },
    applyUpgrade: (u) => {
      const p = ref.current; switch (u) {
        case 'Fire Rate +20%': p.fireRate *= 1.2; break;
        case 'Damage +1': p.damage += 1; break;
        case 'Projectile +1': p.projectileCount += 1; break;
        case 'Speed +10%': p.speed *= 1.1; break;
        default: break;
      }
    },
    reset: () => {
      ref.current = { pos: { x: width / 2, y: height / 2 }, speed: 200, level: 1, xp: 0, fireRate: 2, damage: 1, projectileSpeed: 420, projectileCount: 1, lastShotAt: 0 };
    },
  }), [height, width]);
}

