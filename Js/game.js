function pickSpawn() {
  for (let attempt = 0; attempt < 120; attempt++) {
    const x = 3 + Math.floor(Math.random() * (COLS - 6));
    const y = 3 + Math.floor(Math.random() * (ROWS - 6));
    if (x - 2 < 0) continue;
    const c1 = k(x, y), c2 = k(x - 1, y), c3 = k(x - 2, y);
    if (G.obstacles.has(c1) || G.obstacles.has(c2) || G.obstacles.has(c3)) continue;
    if (G.portalCells.has(c1) || G.portalCells.has(c2) || G.portalCells.has(c3)) continue;
    return { x, y };
  }
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 2; x < COLS - 1; x++) {
      const c1 = k(x, y), c2 = k(x - 1, y), c3 = k(x - 2, y);
      if (!G.obstacles.has(c1) && !G.obstacles.has(c2) && !G.obstacles.has(c3) &&
          !G.portalCells.has(c1) && !G.portalCells.has(c2) && !G.portalCells.has(c3)) {
        return { x, y };
      }
    }
  }
  return { x: 3, y: 3 };
}
