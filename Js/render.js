import { COLS, ROWS, CELL, W, H, SKINS } from './config.js';

export function makeRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  let bgCache = null;

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    if (!bgCache) {
      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, '#0d1c13');
      base.addColorStop(0.5, '#0a1610');
      base.addColorStop(1, '#060d09');

      const g1 = ctx.createRadialGradient(W*.2, H*.12, 0, W*.2, H*.12, W*.75);
      g1.addColorStop(0, 'rgba(74,222,128,0.09)');
      g1.addColorStop(1, 'rgba(74,222,128,0)');

      const g2 = ctx.createRadialGradient(W*.85, H*.9, 0, W*.85, H*.9, W*.75);
      g2.addColorStop(0, 'rgba(251,191,36,0.07)');
      g2.addColorStop(1, 'rgba(251,191,36,0)');

      bgCache = { base, g1, g2 };
    }
    ctx.fillStyle = bgCache.base; ctx.fillRect(-20,-20,W+40,H+40);
    ctx.fillStyle = bgCache.g1;   ctx.fillRect(-20,-20,W+40,H+40);
    ctx.fillStyle = bgCache.g2;   ctx.fillRect(-20,-20,W+40,H+40);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,237,213,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, H);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(W, y * CELL + 0.5);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,237,213,0.06)';
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if ((x + y) % 2 === 0) {
          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
  }

  function drawObstacles(G) {
    for (const key of G.obstacles) {
      const [x, y] = key.split(',').map(Number);
      const px = x * CELL, py = y * CELL;

      const g = ctx.createLinearGradient(px, py, px, py + CELL);
      g.addColorStop(0, 'rgba(120,72,40,0.62)');
      g.addColorStop(1, 'rgba(60,36,20,0.75)');

      ctx.fillStyle = g;
      roundRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3, 5);
      ctx.fill();

      ctx.strokeStyle = 'rgba(200,160,110,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,220,170,0.12)';
      roundRect(px + 3, py + 3, CELL - 6, 3, 2);
      ctx.fill();
    }
  }

  function drawPortals(G, t) {
    for (const key of G.portalCells) {
      const [x, y] = key.split(',').map(Number);
      const cx = x * CELL + CELL / 2;
      const cy = y * CELL + CELL / 2;
      const r = CELL / 2 - 3;
      const pulse = 1 + Math.sin(t / 320 + x + y) * 0.12;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t / 900);
      ctx.scale(pulse, pulse);

      const g = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 1.35);
      g.addColorStop(0, 'rgba(74,222,128,0.95)');
      g.addColorStop(0.45, 'rgba(251,191,36,0.55)');
      g.addColorStop(1, 'rgba(74,222,128,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.32 + i * 0.28), i * 2.1, i * 2.1 + Math.PI * 1.25);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawApple(cx, cy, color, t, scale) {
    const x = cx * CELL + CELL / 2;
    const y = cy * CELL + CELL / 2 + 1;
    const pulse = 1 + Math.sin(t / 230) * 0.07;
    const r = (CELL / 2 - 4.5) * pulse * scale;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.25, color);
    g.addColorStop(1, color === '#fbbf24' ? '#b45309' : '#7f1d1d');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.34, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7c4a1e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - r + 1);
    ctx.lineTo(x + 2, y - r - 4);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(x + 6, y - r - 3, 4.5, 2.5, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBad(cx, cy, t) {
    const x = cx * CELL + CELL / 2;
    const y = cy * CELL + CELL / 2;
    const pulse = 1 + Math.sin(t / 140) * 0.1;
    const r = (CELL / 2 - 4.5) * pulse;

    ctx.save();
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 22;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
    g.addColorStop(0, '#e9d5ff');
    g.addColorStop(0.4, '#a855f7');
    g.addColorStop(1, '#5b21b6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#f5f3ff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y);
    ctx.lineTo(x + r * 0.45, y);
    ctx.stroke();
  }

  function drawFoods(G, t) {
    if (G.apple) drawApple(G.apple.x, G.apple.y, '#ef4444', t, 1);
    if (G.bonus) {
      const expiring = G.bonus.expires - t < 2500;
      const blink = expiring && Math.floor(t / 160) % 2 === 0;
      if (!blink) {
        if (G.bonus.type === 'golden') drawApple(G.bonus.x, G.bonus.y, '#fbbf24', t, 1.12);
        else drawBad(G.bonus.x, G.bonus.y, t);
      }
    }
  }

  function drawSnake(G) {
    const s = G.snake;
    if (!s.length) return;
    const skin = SKINS[G.skinId] || SKINS.classic;
    const n = s.length;

    for (let i = n - 1; i >= 1; i--) {
      const seg = s[i];
      const p = i / Math.max(1, n - 1);
      const pad = 2.2 + p * 1.2;

      let colorA, colorB;
      if (skin.rainbow) {
        const hue = (i * 18) % 360;
        colorA = `hsl(${hue} 88% 62%)`;
        colorB = `hsl(${(hue + 30) % 360} 88% 48%)`;
      } else {
        const b = skin.body;
        const hue   = b.h0 + (b.h1 - b.h0) * p;
        const sat   = b.s0 + (b.s1 - b.s0) * p;
        const light = b.l0 + (b.l1 - b.l0) * p;
        colorA = `hsl(${hue} ${sat}% ${light}%)`;
        colorB = `hsl(${hue - 12} ${sat}% ${Math.max(15, light - 12)}%)`;
      }

      const grad = ctx.createLinearGradient(
        seg.x * CELL, seg.y * CELL,
        seg.x * CELL + CELL, seg.y * CELL + CELL
      );
      grad.addColorStop(0, colorA);
      grad.addColorStop(1, colorB);
      ctx.fillStyle = grad;
      roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 7);
      ctx.fill();
    }

    const head = s[0];
    const hx = head.x * CELL, hy = head.y * CELL;

    ctx.save();
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 20;
    const hg = ctx.createLinearGradient(hx, hy, hx + CELL, hy + CELL);
    hg.addColorStop(0, skin.head[0]);
    hg.addColorStop(1, skin.head[1]);
    ctx.fillStyle = hg;
    roundRect(hx + 1.8, hy + 1.8, CELL - 3.6, CELL - 3.6, 9);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    roundRect(hx + 1.8, hy + 1.8, CELL - 3.6, CELL - 3.6, 9);
    ctx.stroke();

    const d = G.dir;
    const perp = { x: -d.y, y: d.x };
    const cx = hx + CELL / 2, cy = hy + CELL / 2;

    for (const sign of [-1, 1]) {
      const ex = cx + d.x * 4.2 + perp.x * 4.8 * sign;
      const ey = cy + d.y * 4.2 + perp.y * 4.8 * sign;

      ctx.fillStyle = '#04121a';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 0.9, ey - 0.9, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles(G) {
    for (const p of G.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawVignette() {
    const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  function draw(G, t) {
    ctx.save();
    if (G.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
      G.shake *= 0.86;
    }
    ctx.clearRect(-20, -20, W + 40, H + 40);
    drawBackground();
    drawGrid();
    drawObstacles(G);
    drawPortals(G, t);
    drawFoods(G, t);
    drawSnake(G);
    drawParticles(G);
    drawVignette();
    ctx.restore();
  }

  return { draw, ctx };
}