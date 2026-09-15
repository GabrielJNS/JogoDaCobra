class MinHeap {
  constructor() { this.a = []; }
  push(item) {
    this.a.push(item);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p].f <= this.a[i].f) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      let i = 0;
      const n = this.a.length;
      while (true) {
        const l = i * 2 + 1, r = l + 1;
        let s = i;
        if (l < n && this.a[l].f < this.a[s].f) s = l;
        if (r < n && this.a[r].f < this.a[s].f) s = r;
        if (s === i) break;
        [this.a[s], this.a[i]] = [this.a[i], this.a[s]];
        i = s;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

export function aStar(start, goal, isBlocked, cols, rows, wrap = false) {
  const k = (x, y) => x + ',' + y;
  const h = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

  const open = new MinHeap();
  const gScore = new Map();
  const cameFrom = new Map();
  const closed = new Set();

  const sk = k(start.x, start.y);
  gScore.set(sk, 0);
  open.push({ x:start.x, y:start.y, f:h(start.x, start.y) });

  const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];

  while (open.size) {
    const cur = open.pop();
    const ck = k(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);

    if (cur.x === goal.x && cur.y === goal.y) {
      const path = [];
      let node = ck;
      while (node) {
        const [x, y] = node.split(',').map(Number);
        path.push({ x, y });
        node = cameFrom.get(node);
      }
      return path.reverse();
    }

    const gCur = gScore.get(ck);

    for (const [dx, dy] of neighbors) {
      let nx = cur.x + dx;
      let ny = cur.y + dy;

      if (wrap) {
        if (nx < 0) nx = cols - 1; else if (nx >= cols) nx = 0;
        if (ny < 0) ny = rows - 1; else if (ny >= rows) ny = 0;
      } else {
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      }

      const nk = k(nx, ny);
      if (closed.has(nk)) continue;
      if (isBlocked(nx, ny) && nk !== k(goal.x, goal.y)) continue;

      const tentative = gCur + 1;
      const known = gScore.get(nk);
      if (known != null && tentative >= known) continue;

      gScore.set(nk, tentative);
      cameFrom.set(nk, ck);
      open.push({ x:nx, y:ny, f:tentative + h(nx, ny) });
    }
  }

  return null;
}