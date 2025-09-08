import React, { useEffect, useRef } from 'react';

function loadImage(path) { const img = new Image(); img.src = process.env.PUBLIC_URL + path; return img; }

const imgPlayer = loadImage('/luffy.png');
const imgEnemy = [loadImage('/enemy1.png'), loadImage('/enemy2.png'), loadImage('/enemy3.png')];
const imgBoss = [loadImage('/boss1.png'), loadImage('/boss2.png')];
const imgProjectile = loadImage('/akainu.png');

function pick(list, key) { return list[key % list.length]; }

export default function GameCanvas({ width, height, cssScale, state }) {
  const canvasRef = useRef(null);
  const enemySpriteKey = useRef(new Map());

  useEffect(() => {
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(width * cssScale * dpr);
    c.height = Math.floor(height * cssScale * dpr);
    c.style.width = `${Math.floor(width * cssScale)}px`;
    c.style.height = `${Math.floor(height * cssScale)}px`;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr * cssScale, 0, 0, dpr * cssScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }, [cssScale, height, width]);

  useEffect(() => {
    const c = canvasRef.current; const ctx = c.getContext('2d');
    // background grid
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#1f1f1f'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    // player 10%
    const p = state.player;
    if (imgPlayer.complete && imgPlayer.width) {
      const w = imgPlayer.width * 0.1; const h = imgPlayer.height * 0.1; ctx.drawImage(imgPlayer, p.pos.x - w / 2, p.pos.y - h / 2, w, h);
    } else { ctx.fillStyle = '#4fc3f7'; ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, 10, 0, Math.PI * 2); ctx.fill(); }

    // enemies 10%
    for (const e of state.enemies) {
      if (!enemySpriteKey.current.has(e.id)) enemySpriteKey.current.set(e.id, Math.floor(Math.random() * 1000));
      const key = enemySpriteKey.current.get(e.id);
      const img = e.boss ? pick(imgBoss, key) : pick(imgEnemy, key);
      if (img.complete && img.width) {
        const w = img.width * 0.1; const h = img.height * 0.1; ctx.drawImage(img, e.pos.x - w / 2, e.pos.y - h / 2, w, h);
      } else { ctx.fillStyle = e.boss ? '#ef5350' : '#ffca28'; ctx.beginPath(); ctx.arc(e.pos.x, e.pos.y, e.boss ? 16 : 10, 0, Math.PI * 2); ctx.fill(); }
    }

    // projectiles 10%
    for (const prj of state.projectiles) {
      if (imgProjectile.complete && imgProjectile.width) {
        const w = imgProjectile.width * 0.1; const h = imgProjectile.height * 0.1; ctx.drawImage(imgProjectile, prj.pos.x - w / 2, prj.pos.y - h / 2, w, h);
      } else { ctx.fillStyle = '#90caf9'; ctx.beginPath(); ctx.arc(prj.pos.x, prj.pos.y, 4, 0, Math.PI * 2); ctx.fill(); }
    }
  }, [height, state.enemies, state.player, state.projectiles, width]);

  return <canvas ref={canvasRef} />;
}

