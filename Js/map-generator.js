import { COLS, ROWS } from './config.js';

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

function floodFill(walls) {
  const seen = new Set();
  let best = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const k0 = x + ',' + y;
      if (walls.has(k0) || seen.has(k0)) continue;
      const stack = [[x, y]];
      const region = [];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const ck = cx + ',' + cy;
        if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) continue;
        if (seen.has(ck) || walls.has(ck)) continue;
        seen.add(ck);
        region.push([cx, cy]);
        stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
      }
      if (region.length > best.length) best = region;
    }
  }
  return best;
}

export function generateRandomMap({ seed = Date.now(), density = 0.15 } = {}) {
  const rng = makeRng(seed);
  const walls = new Set();

  const safe = new Set();
  for (let y = 9; y <= 11; y++)
    for (let x = 8; x <= 12; x++) safe.add(x + ',' + y);

  const blobs = 9 + Math.floor(rng() * 7);
  for (let b = 0; b < blobs; b++) {
    const cx = 2 + Math.floor(rng() * (COLS - 4));
    const cy = 2 + Math.floor(rng() * (ROWS - 4));
    const size = 2 + Math.floor(rng() * 3);
    const shape = rng();
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const d = Math.hypot(dx, dy);
        const hit = shape < 0.5 ? d <= size : d + rng() * 1.2 <= size;
        if (!hit) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        if (safe.has(x + ',' + y)) continue;
        if (rng() < density + 0.35) walls.add(x + ',' + y);
      }
    }
  }

  const region = floodFill(walls);
  if (region.length < COLS * ROWS * 0.6) {
    [...walls].filter(() => rng() < 0.4).forEach(k => walls.delete(k));
  }

  const portals = {};
  const totalPairs = 1 + Math.floor(rng() * 3);
  for (let p = 0; p < totalPairs; p++) {
    const edge = Math.floor(rng() * 4);
    const pos = 4 + Math.floor(rng() * (COLS - 8));
    let a, b;
    if (edge === 0) { a = [pos, 0];      b = [pos, ROWS-1]; }
    if (edge === 1) { a = [pos, ROWS-1]; b = [pos, 0];      }
    if (edge === 2) { a = [0, pos];      b = [COLS-1, pos]; }
    if (edge === 3) { a = [COLS-1, pos]; b = [0, pos];      }
    const ka = a.join(','), kb = b.join(',');
    if (safe.has(ka) || safe.has(kb)) continue;
    if (walls.has(ka) || walls.has(kb)) continue;
    walls.delete(ka); walls.delete(kb);
    portals[ka] = { x:b[0], y:b[1] };
    portals[kb] = { x:a[0], y:a[1] };
  }

  const layout = [];
  for (let y = 0; y < ROWS; y++) {
    let row = '';
    for (let x = 0; x < COLS; x++) {
      const kk = x + ',' + y;
      if (walls.has(kk)) row += '#';
      else if (portals[kk]) row += 'O';
      else row += '.';
    }
    layout.push(row);
  }

  return { layout, portals };
}