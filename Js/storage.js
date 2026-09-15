const PREFIX = 'snake_';

export const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? fallback : v;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(PREFIX + key, String(val)); } catch {}
  },
  getInt(key, fallback = 0) {
    const v = parseInt(this.get(key, ''), 10);
    return Number.isFinite(v) ? v : fallback;
  },
  getBool(key, fallback = false) {
    const v = this.get(key, null);
    if (v === null) return fallback;
    return v === '1' || v === 'true';
  },
  getJSON(key, fallback) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  setJSON(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch {}
  }
};

export const bestKey  = m => 'best_' + m;
export const getBest  = m => store.getInt(bestKey(m), 0);
export const saveBest = (m, v) => store.set(bestKey(m), v);