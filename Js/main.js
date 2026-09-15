import { MAPS, SKINS } from './config.js';
import { store, getBest } from './storage.js';
import { Sound, Sfx } from './audio.js';
import { createGame } from './game.js';
import { makeRenderer } from './render.js';
import { createUI } from './ui.js';

const canvas   = document.getElementById('board');
const renderer = makeRenderer(canvas);
const uiKit    = createUI();
const { ui }   = uiKit;

const SKIN_LIST = Object.values(SKINS);

let currentSkin = store.get('current_skin', 'classic');
if (!SKINS[currentSkin]) currentSkin = 'classic';

let selectedMap = store.get('selected_map', 'livre');
if (!MAPS[selectedMap]) selectedMap = 'livre';

let skinIndex = SKIN_LIST.findIndex(s => s.id === currentSkin);
if (skinIndex < 0) skinIndex = 0;

const countdownEl = document.createElement('div');
countdownEl.className = 'countdown hidden';
document.querySelector('.board-wrap').appendChild(countdownEl);

let countdownTimer = null;
let countdownValue = 0;
let isCounting = false;

const game = createGame({
  onDie: ({ score, coins, newRecord }) => {
    const total = store.getInt('coins', 0) + coins;
    store.set('coins', total);

    uiKit.showOver({
      score,
      best: getBest(game.G.mapKey),
      newRecord,
      coins
    });

    if (newRecord) setTimeout(() => Sfx.record(), 750);
  },
  onScoreChange: () => uiKit.updateHUD(game.G, true)
});

game.G.skinId = currentSkin;

uiKit.refreshSoundBtn();
uiKit.refreshCoins();
uiKit.updateHUD(game.G);
uiKit.setPlayButton('menu');
renderMenu();

function renderMenu() {
  uiKit.renderMenu(selectedMap, key => {
    selectedMap = key;
    store.set('selected_map', key);
    Sfx.click();
    renderMenu();
  });

  const skin = SKIN_LIST[skinIndex];
  const unlocked = store.getJSON('unlocked_skins', ['classic']);
  const isUnlocked = unlocked.includes(skin.id);
  const isActive = game.G.skinId === skin.id;

  uiKit.renderSkinCarousel(skin, skinIndex, SKIN_LIST.length,
    { unlocked:isUnlocked, active:isActive },
    { onSkinClick: onSkinDisplayClick }
  );

  uiKit.refreshCoins();
}

function onSkinDisplayClick() {
  const skin = SKIN_LIST[skinIndex];
  const unlocked = store.getJSON('unlocked_skins', ['classic']);

  if (unlocked.includes(skin.id)) {
    if (game.G.skinId === skin.id) return;
    currentSkin = skin.id;
    game.G.skinId = skin.id;
    store.set('current_skin', skin.id);
    Sfx.click();
    uiKit.flashSkinDisplay('good');
    renderMenu();
    return;
  }

  const coins = store.getInt('coins', 0);
  if (coins < skin.price) {
    Sfx.bad();
    uiKit.flashSkinDisplay('bad');
    return;
  }

  unlocked.push(skin.id);
  store.setJSON('unlocked_skins', unlocked);
  store.set('coins', coins - skin.price);

  currentSkin = skin.id;
  game.G.skinId = skin.id;
  store.set('current_skin', skin.id);

  Sfx.unlock();
  uiKit.flashSkinDisplay('good');
  renderMenu();
}

ui.skinPrev.addEventListener('click', () => {
  if (skinIndex <= 0) return;
  skinIndex--;
  Sfx.click();
  renderMenu();
});

ui.skinNext.addEventListener('click', () => {
  if (skinIndex >= SKIN_LIST.length - 1) return;
  skinIndex++;
  Sfx.click();
  renderMenu();
});

function showCountdown() {
  if (isCounting) return;
  isCounting = true;
  clearTimeout(countdownTimer);
  countdownValue = 3;
  countdownEl.textContent = countdownValue;
  countdownEl.classList.remove('hidden');
  countdownEl.style.animation = 'none';
  void countdownEl.offsetWidth;
  countdownEl.style.animation = '';

  const tick = () => {
    countdownValue--;
    if (countdownValue <= 0) {
      countdownEl.textContent = 'GO!';
      countdownEl.style.animation = 'none';
      void countdownEl.offsetWidth;
      countdownEl.style.animation = '';
      countdownTimer = setTimeout(() => {
        countdownEl.classList.add('hidden');
        isCounting = false;
      }, 500);
      return;
    }
    countdownEl.textContent = countdownValue;
    countdownEl.style.animation = 'none';
    void countdownEl.offsetWidth;
    countdownEl.style.animation = '';
    countdownTimer = setTimeout(tick, 900);
  };
  countdownTimer = setTimeout(tick, 900);
}

function hideCountdown() {
  clearTimeout(countdownTimer);
  isCounting = false;
  countdownEl.classList.add('hidden');
}

function showMenu() {
  hideCountdown();
  game.G.status = 'menu';
  uiKit.setPlayButton('menu');
  uiKit.showScreen('menu');
  renderMenu();
}

function startAndCountdown(mapKey) {
  game.start(mapKey);
  uiKit.hideOverlay();
  uiKit.setPlayButton('countdown');
  showCountdown();
}

ui.btnPlayMenu.addEventListener('click', () => {
  startAndCountdown(selectedMap);
});

ui.btnPlay.addEventListener('click', () => {
  const s = game.G.status;
  if (s === 'menu' || s === 'over') startAndCountdown(selectedMap);
  else {
    if (game.togglePause()) {
      uiKit.setPlayButton(game.G.status);
      if (game.G.status === 'paused') uiKit.showScreen('pause');
      else uiKit.hideOverlay();
    }
  }
});

ui.btnRestart.addEventListener('click', () => startAndCountdown(game.G.mapKey));
ui.btnMenu.addEventListener('click', showMenu);

document.getElementById('btnResume').addEventListener('click', () => {
  game.togglePause();
  uiKit.setPlayButton('playing');
  uiKit.hideOverlay();
});
document.getElementById('btnMenuPause').addEventListener('click', showMenu);
document.getElementById('btnPlayAgain').addEventListener('click', () => startAndCountdown(game.G.mapKey));
document.getElementById('btnMenuOver').addEventListener('click', showMenu);
document.getElementById('btnHelp').addEventListener('click', openHelp);
document.getElementById('btnCloseHelp').addEventListener('click', closeHelp);

ui.btnSound.addEventListener('click', () => {
  Sound.toggle();
  uiKit.refreshSoundBtn();
});

function openHelp() {
  if (game.G.status === 'playing') {
    game.G.status = 'paused';
    game.G.helpPause = true;
    uiKit.setPlayButton('paused');
  }
  ui.helpModal.classList.remove('hidden');
}

function closeHelp() {
  ui.helpModal.classList.add('hidden');
  if (game.G.helpPause) {
    game.G.status = 'playing';
    game.G.last = performance.now();
    game.G.helpPause = false;
    uiKit.setPlayButton('playing');
  }
}

const DIRS = {
  up:{ x:0, y:-1 }, down:{ x:0, y:1 },
  left:{ x:-1, y:0 }, right:{ x:1, y:0 }
};

window.addEventListener('keydown', e => {
  const key = e.key;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)) e.preventDefault();

  if (key === 'ArrowUp'    || key === 'w' || key === 'W') game.setDir(DIRS.up);
  if (key === 'ArrowDown'  || key === 's' || key === 'S') game.setDir(DIRS.down);
  if (key === 'ArrowLeft'  || key === 'a' || key === 'A') game.setDir(DIRS.left);
  if (key === 'ArrowRight' || key === 'd' || key === 'D') game.setDir(DIRS.right);

  if (key === ' ' || key === 'p' || key === 'P') {
    if (game.togglePause()) {
      uiKit.setPlayButton(game.G.status);
      if (game.G.status === 'paused') uiKit.showScreen('pause');
      else uiKit.hideOverlay();
    }
  }
  if (key === 'r' || key === 'R') {
    if (game.G.status !== 'menu') startAndCountdown(game.G.mapKey);
  }
  if (key === 'm' || key === 'M') {
    Sound.toggle();
    uiKit.refreshSoundBtn();
  }
  if (key === 'Escape') {
    if (!ui.helpModal.classList.contains('hidden')) closeHelp();
    else showMenu();
  }
}, { passive:false });

document.querySelectorAll('[data-dir]').forEach(btn => {
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    game.setDir(DIRS[btn.dataset.dir]);
  });
});

let touchStart = null;
const wrap = document.querySelector('.board-wrap');

wrap.addEventListener('touchstart', e => {
  const t0 = e.changedTouches[0];
  touchStart = { x:t0.clientX, y:t0.clientY };
}, { passive:true });

wrap.addEventListener('touchend', e => {
  if (!touchStart) return;
  const t0 = e.changedTouches[0];
  const dx = t0.clientX - touchStart.x;
  const dy = t0.clientY - touchStart.y;
  touchStart = null;
  if (Math.hypot(dx, dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) game.setDir(dx > 0 ? DIRS.right : DIRS.left);
  else                             game.setDir(dy > 0 ? DIRS.down  : DIRS.up);
}, { passive:true });

['pointerdown','touchstart','keydown'].forEach(ev =>
  window.addEventListener(ev, () => Sound.unlock(), { once:true, passive:true })
);

function frame(now) {
  game.loop(now, renderer);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.G.status === 'playing') {
    game.togglePause();
    uiKit.setPlayButton('paused');
    uiKit.showScreen('pause');
  }
});

document.addEventListener('contextmenu', e => {
  if (e.target.closest('.btn, .dpad button, .map-card, .board-wrap, .skin-display, .carousel-arrow')) {
    e.preventDefault();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}