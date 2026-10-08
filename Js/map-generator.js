export function generateRandomMap({ seed = Date.now(), density = 0.08 } = {}) {
  const rng = makeRng(seed);
  const walls = new Set();

  const safe = new Set();
  for (let y = 9; y <= 11; y++)
    for (let x = 8; x <= 12; x++) safe.add(x + ',' + y);

  const blobs = 6 + Math.floor(rng() * 4);      
  for (let b = 0; b < blobs; b++) {
    const cx = 2 + Math.floor(rng() * (COLS - 4));
    const cy = 2 + Math.floor(rng() * (ROWS - 4));
    const size = 1 + Math.floor(rng() * 2);     
    const shape = rng();
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const d = Math.hypot(dx, dy);
        const hit = shape < 0.5 ? d <= size : d + rng() * 1.2 <= size;
        if (!hit) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 1 || y < 1 || x >= COLS - 1 || y >= ROWS - 1) continue; 
        if (safe.has(x + ',' + y)) continue;
        if (rng() < density + 0.25) walls.add(x + ',' + y);
      }
    }
  }

  // ... resto igual (floodFill, portais, layout)
