import { store } from './storage.js';

export const Sound = {
  ctx:null,
  master:null,
  muted: store.getBool('muted', false),

  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.3;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  },

  unlock() {
    const c = this.init();
    if (c && c.state === 'suspended') c.resume();
  },

  tone(o) {
    if (this.muted) return;
    const c = this.init();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    const t0 = c.currentTime + (o.delay || 0);
    const dur = Math.max(0.03, o.dur || 0.15);
    const f0 = Math.max(20, o.f0 || 440);

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + dur);

    const vol = o.vol == null ? 0.3 : o.vol;
    const atk = Math.min(o.attack || 0.01, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  },

  noise(o) {
    if (this.muted) return;
    const c = this.init();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    const dur = o.dur || 0.3;
    const t0 = c.currentTime + (o.delay || 0);
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

    const src = c.createBufferSource();
    src.buffer = buf;

    const flt = c.createBiquadFilter();
    flt.type = 'bandpass';
    flt.Q.value = o.q || 1.2;
    flt.frequency.setValueAtTime(Math.max(20, o.f0 || 900), t0);
    flt.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1 || 200), t0 + dur);

    const g = c.createGain();
    g.gain.setValueAtTime(o.vol == null ? 0.22 : o.vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(flt);
    flt.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  },

  toggle() {
    this.muted = !this.muted;
    store.set('muted', this.muted ? '1' : '0');
    if (!this.muted) { this.unlock(); Sfx.click(); }
    return this.muted;
  }
};

export const Sfx = {
  click()  { Sound.tone({ type:'triangle', f0:620, f1:420, dur:0.055, vol:0.13 }); },
  eat()    {
    Sound.tone({ type:'triangle', f0:620, f1:900, dur:0.09, vol:0.32 });
    Sound.tone({ type:'triangle', f0:980, f1:1280, dur:0.1, vol:0.2, delay:0.055 });
  },
  golden() {
    [660, 880, 1180, 1560].forEach((f, i) =>
      Sound.tone({ type:'square', f0:f, dur:0.1, vol:0.11, delay:i*0.055 }));
    Sound.tone({ type:'triangle', f0:1320, f1:1760, dur:0.28, vol:0.16, delay:0.23 });
  },
  bad()    {
    Sound.tone({ type:'sawtooth', f0:320, f1:80, dur:0.38, vol:0.26 });
    Sound.noise({ f0:700, f1:120, dur:0.3, vol:0.16 });
  },
  portal() {
    Sound.noise({ f0:380, f1:2600, dur:0.32, vol:0.14, q:1.6 });
    Sound.tone({ type:'sine', f0:260, f1:920, dur:0.3, vol:0.18 });
  },
  start()  {
    [440, 660, 880].forEach((f, i) =>
      Sound.tone({ type:'triangle', f0:f, dur:0.13, vol:0.18, delay:i*0.08 }));
  },
  pause()  { Sound.tone({ type:'sine', f0:520, f1:340, dur:0.14, vol:0.16 }); },
  die()    {
    Sound.tone({ type:'sawtooth', f0:420, f1:70, dur:0.7, vol:0.28 });
    Sound.tone({ type:'sine', f0:180, f1:50, dur:0.8, vol:0.22, delay:0.05 });
  },
  record() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      Sound.tone({ type:'triangle', f0:f, dur:0.18, vol:0.18, delay:i*0.09 }));
  },
  unlock() {
    [523, 659, 784, 1047].forEach((f, i) =>
      Sound.tone({ type:'triangle', f0:f, dur:0.14, vol:0.16, delay:i*0.07 }));
  }
};