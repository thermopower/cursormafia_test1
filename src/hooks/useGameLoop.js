import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import usePlayer from './usePlayer';
import useEnemies from './useEnemies';
import useProjectiles from './useProjectiles';

const UPGRADES = ['Fire Rate +20%', 'Damage +1', 'Projectile +1', 'Speed +10%'];

function normalize(v) { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function nearest(target, list) { let best = null, bestD = Infinity; for (const e of list) { const d = dist(target, e.pos); if (d < bestD) { bestD = d; best = e; } } return best; }

export default function useGameLoop({ width, height, inputVector }) {
  const player = usePlayer({ width, height });
  const enemies = useEnemies({ width, height });
  const projectiles = useProjectiles();

  const [state, setState] = useState({
    running: true,
    gameOver: false,
    elapsed: 0,
    kills: 0,
    killPoints: 0,
    levelUp: { open: false, options: [] },
    player: player.get(),
    enemies: enemies.list(),
    projectiles: projectiles.list(),
    score: 0,
  });

  const lastTimeRef = useRef(0);

  const step = useCallback((tMs) => {
    const t = tMs / 1000; const last = lastTimeRef.current || t; const dt = Math.min(0.05, t - last); lastTimeRef.current = t;

    if (!state.running) return; // paused: freeze everything including time/score

    // movement
    const vec = inputVector || { x: 0, y: 0 }; player.move(vec.x, vec.y, dt);

    // spawns + steering
    enemies.spawnIfDue(t); enemies.maybeSpawnBoss(); enemies.steerTowards(player.get().pos, dt);

    // auto fire
    if (player.canShoot(t)) {
      const list = enemies.list(); let dir = { x: 1, y: 0 };
      if (list.length > 0) { const n = nearest(player.get().pos, list); dir = normalize({ x: n.pos.x - player.get().pos.x, y: n.pos.y - player.get().pos.y }); }
      else if (Math.hypot(vec.x, vec.y) > 0.5) { dir = normalize(vec); }
      projectiles.spawnVolley({ origin: { ...player.get().pos }, count: player.get().projectileCount, speed: player.get().projectileSpeed, damage: player.get().damage }, dir);
      player.markShot(t);
    }

    // projectiles step
    projectiles.step(dt, { width, height });

    // projectile vs enemy
    for (const p of [...projectiles.list()]) {
      for (const e of [...enemies.list()]) {
        const hitR = (e.boss ? 16 : 10) + 4; // rough radii
        if (dist(p.pos, e.pos) <= hitR) {
          const xp = enemies.hit(e.id, p.damage);
          projectiles.remove(p.id);
          if (xp > 0) {
            player.addXP(xp);
            setState((s) => ({ ...s, killPoints: s.killPoints + (xp >= 5 ? 5 : 1) }));
          }
          break;
        }
      }
    }

    // player vs enemy -> instant game over
    for (const e of enemies.list()) {
      const r = (e.boss ? 16 : 10) + 10; if (dist(player.get().pos, e.pos) <= r) { setState((s) => ({ ...s, running: false, gameOver: true })); return; }
    }

    // level up check
    if (!state.levelUp.open && player.thresholdReached()) {
      player.levelUp();
      const options = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
      setState((s) => ({ ...s, levelUp: { open: true, options }, running: false }));
    }

    // time/score update
    setState((s) => {
      const elapsed = s.elapsed + dt; const kills = enemies.kills();
      const timePoints = Math.floor(elapsed); const score = timePoints + s.killPoints;
      return { ...s, elapsed, kills, player: player.get(), enemies: enemies.list(), projectiles: projectiles.list(), score };
    });
  }, [enemies, height, inputVector, player, projectiles, state.levelUp.open, state.running, width]);

  // RAF loop
  const stepRef = useRef(() => {});
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { let raf = 0; const loop = (t) => { stepRef.current(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf); }, []);

  const applyUpgrade = useCallback((u) => { player.applyUpgrade(u); setState((s) => ({ ...s, levelUp: { open: false, options: [] }, running: true })); }, [player]);
  const restart = useCallback(() => { lastTimeRef.current = 0; enemies.clear(); projectiles.clear(); player.reset(); setState((s) => ({ ...s, running: true, gameOver: false, elapsed: 0, kills: 0, killPoints: 0, levelUp: { open: false, options: [] }, player: player.get(), enemies: enemies.list(), projectiles: projectiles.list(), score: 0 })); }, [enemies, player, projectiles]);

  return useMemo(() => ({ state, applyUpgrade, restart }), [applyUpgrade, restart, state]);
}

