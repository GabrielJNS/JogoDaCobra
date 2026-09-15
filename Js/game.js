import { COLS, ROWS, EMPTY_ROW, BASE_SPEED, BONUS_TTL, BONUS_CHANCE, computeSpeed, MAPS } from './config.js';
import { getBest, saveBest } from './storage.js';
import { generateRandomMap } from './map-generator.js';
import { aStar } from './pathfinding.js';
import { Sound, Sfx } from './audio.js';

const k = (x, y) => x + ',' + y;

export function createGame({ onDie, onScoreChange } = {}) {
  const G = {
    mapKey:'livre',
    obstacles:new Set(),
    portalCells:new Set(),
    portals:{},
    wrapEnabled:true,
    snake:[],
    dir:{ x:1, y:0 },
    nextDir:{ x:1, y:0 },
    grow:0,
    apple:null,
    bonus:null,
    score:0,
    best:0,
    coinsEarned:0,
    newRecord:false,
    status:'menu',
    stepMs:BASE_SPEED,
    acc:0,
    last:0,
    particles:[],
    shake:0,
    helpPause:false,
    skinId:'classic',
    countdown:0
  };

  function parseLayout(layout) {
    const walls = new Set();
    const portals = new Set();
    for (let y = 0; y < ROWS; y++) {
      const row = layout[y] || EMPTY_ROW;
      for (let x = 0; x < COLS; x++) {
        const c = row[x];
        if (c === '#') walls.add(k(x, y));
        else if (c === 'O') portals.add(k(x, y));
      }
    }
    return { walls, portals };
  }

  function isBlockedFactory(extraBlocked = null) {
    return (x, y) => {
      if (G.obstacles.has(k(x, y))) return true;
      if (extraBlocked && extraBlocked.has(k(x, y))) return true;
      return false;
    };
  }

  function isReachable(target) {
    if (!G.snake.length || !target) return false;

    const bodySet = new Set();
    for (let i = 0; i < G.snake.length - 1; i++) {
      bodySet.add(k(G.snake[i].x, G.snake[i].y));
    }

    const start = G.snake[0];
    const path = aStar(start, target, isBlockedFactory(bodySet), COLS, ROWS, G.wrapEnabled);
    if (path) return true;

    const pathWalls = aStar(start, target, isBlockedFactory(), COLS, ROWS, G.wrapEnabled);
    return !!pathWalls;
  }

  function freeCells() {
    const occ = new Set(G.obstacles);
    for (const s of G.snake) occ.add(k(s.x, s.y));
    if (G.apple) occ.add(k(G.apple.x, G.apple.y));
    if (G.bonus) occ.add(k(G.bonus.x, G.bonus.y));

    const free = [];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const kk = k(x, y);
        if (!occ.has(kk) && !G.portalCells.has(kk)) free.push({ x, y });
      }
    return free;
  }

  function randomFreeCell() {
    const free = freeCells();
    if (!free.length) return null;

    for (let i = 0; i < 40; i++) {
      const candidate = free[(Math.random() * free.length) | 0];
      if (isReachable(candidate)) return candidate;
    }

    for (const c of free) if (isReachable(c)) return c;
    return free[(Math.random() * free.length) | 0];
  }

  function burst(cx, cy, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.03 + Math.random() * 0.13) * 24;
      G.particles.push({
        x:cx * 24 + 12, y:cy * 24 + 12,
        vx:Math.cos(a) * sp, vy:Math.sin(a) * sp,
        life:1, color, size:2 + Math.random() * 3.5
      });
    }
  }

  function updateParticles(dt) {
    const f = dt / 16.67;
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= 0.035 * f;
      if (p.life <= 0) G.particles.splice(i, 1);
    }
  }

  function pickSpawn() {
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = 8 + Math.floor(Math.random() * 5);
      const y = 8 + Math.floor(Math.random() * 5);
      const c1 = k(x, y), c2 = k(x - 1, y), c3 = k(x - 2, y);
      if (G.obstacles.has(c1) || G.obstacles.has(c2) || G.obstacles.has(c3)) continue;
      if (G.portalCells.has(c1) || G.portalCells.has(c2) || G.portalCells.has(c3)) continue;
      return { x, y };
    }
    return { x:10, y:10 };
  }

  function start(mapKey) {
    const map = MAPS[mapKey];
    if (!map) return;

    G.mapKey = mapKey;
    let layout = map.layout;
    let portals = map.portals || {};

    if (map.random) {
      const gen = generateRandomMap({ seed: Date.now() });
      layout = gen.layout;
      portals = gen.portals;
    }

    const parsed = parseLayout(layout);
    G.obstacles = parsed.walls;
    G.portalCells = parsed.portals;
    G.portals = portals;
    G.wrapEnabled = map.wrapEnabled !== false;

    const spawn = pickSpawn();
    G.snake = [
      { x:spawn.x,   y:spawn.y   },
      { x:spawn.x-1, y:spawn.y   },
      { x:spawn.x-2, y:spawn.y   }
    ];
    G.dir = { x:1, y:0 };
    G.nextDir = { x:1, y:0 };
    G.grow = 0;
    G.score = 0;
    G.newRecord = false;
    G.coinsEarned = 0;
    G.bonus = null;
    G.stepMs = BASE_SPEED;
    G.acc = 0;
    G.particles = [];
    G.shake = 0;
    G.best = getBest(mapKey);

    G.status = 'countdown';
    G.countdown = 3.2;

    G.apple = randomFreeCell();
    Sound.unlock();
    Sfx.start();
    onScoreChange?.();
  }

  function step() {
    G.dir = G.nextDir;
    let nx = G.snake[0].x + G.dir.x;
    let ny = G.snake[0].y + G.dir.y;

    const pKey = nx + ',' + ny;
    if (G.portals[pKey]) {
      const dest = G.portals[pKey];
      burst(nx, ny, '#4ade80', 14);
      Sfx.portal();
      nx = dest.x;
      ny = dest.y;
      burst(nx, ny, '#fbbf24', 14);
      G.shake = 4;
    } else if (G.wrapEnabled) {
      if (nx < 0) nx = COLS - 1; else if (nx >= COLS) nx = 0;
      if (ny < 0) ny = ROWS - 1; else if (ny >= ROWS) ny = 0;
    }

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return die();
    if (G.obstacles.has(k(nx, ny))) return die();

    const body = G.grow > 0 ? G.snake : G.snake.slice(0, -1);
    if (body.some(s => s.x === nx && s.y === ny)) return die();

    G.snake.unshift({ x:nx, y:ny });
    if (G.grow > 0) G.grow--; else G.snake.pop();

    if (G.apple && nx === G.apple.x && ny === G.apple.y) eatApple();
    if (G.bonus && nx === G.bonus.x && ny === G.bonus.y) eatBonus();
  }

  function eatApple() {
    G.score += 1;
    G.grow += 1;
    burst(G.apple.x, G.apple.y, '#ef4444', 12);
    Sfx.eat();
    G.apple = randomFreeCell();
    G.stepMs = computeSpeed(G.score);
    if (!G.bonus && Math.random() < BONUS_CHANCE) spawnBonus();
    onScoreChange?.();
  }

  function eatBonus() {
    const b = G.bonus;
    if (b.type === 'golden') {
      G.score += 5;
      G.grow += 1;
      burst(b.x, b.y, '#fbbf24', 22);
      Sfx.golden();
    } else {
      G.score = Math.max(0, G.score - 3);
      for (let i = 0; i < 2 && G.snake.length > 3; i++) G.snake.pop();
      burst(b.x, b.y, '#a855f7', 22);
      G.shake = 8;
      Sfx.bad();
    }
    G.bonus = null;
    onScoreChange?.();
  }

  function spawnBonus() {
    const cell = randomFreeCell();
    if (!cell) return;
    G.bonus = {
      x:cell.x,
      y:cell.y,
      type: Math.random() < 0.55 ? 'golden' : 'bad',
      expires: performance.now() + BONUS_TTL
    };
  }

  function die() {
    G.status = 'over';
    G.shake = 14;
    Sfx.die();
    if (G.snake.length) burst(G.snake[0].x, G.snake[0].y, '#4ade80', 30);

    G.newRecord = G.score > G.best && G.score > 0;
    if (G.score > G.best) {
      G.best = G.score;
      saveBest(G.mapKey, G.best);
    }

    G.coinsEarned = Math.floor(G.score * 1.5);

    onDie?.({ score:G.score, coins:G.coinsEarned, newRecord:G.newRecord });
  }

  function loop(t, renderer) {
    const dt = Math.min(t - (G.last || t), 100);
    G.last = t;

    if (G.status === 'countdown') {
      G.countdown -= dt / 1000;
      if (G.countdown <= 0) {
        G.status = 'playing';
        G.last = performance.now();
      }
    } else if (G.status === 'playing') {
      G.acc += dt;
      while (G.acc >= G.stepMs) {
        G.acc -= G.stepMs;
        if (G.status === 'playing') step(); else break;
      }
      if (G.bonus && t > G.bonus.expires) G.bonus = null;
    }

    updateParticles(dt);
    renderer.draw(G, t);
  }

  function setDir(d) {
    if (G.status !== 'playing') return;
    if (d.x === -G.dir.x && d.y === -G.dir.y) return;
    if (d.x === G.dir.x && d.y === G.dir.y) return;
    G.nextDir = d;
  }

  function togglePause() {
    if (G.status === 'playing') {
      G.status = 'paused';
      Sfx.pause();
      return true;
    }
    if (G.status === 'paused') {
      G.status = 'playing';
      G.last = performance.now();
      Sfx.click();
      return true;
    }
    return false;
  }

  return { G, start, loop, setDir, togglePause, burst };
}