import { MAPS, ICONS, SKINS } from './config.js';
import { store, getBest } from './storage.js';
import { Sound } from './audio.js';

const $ = id => document.getElementById(id);

const SOUND_ON  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h3.2L12 19V5L7.2 9H4z"/><path d="M15.4 8.6a5 5 0 0 1 0 6.8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M18.2 5.8a9 9 0 0 1 0 12.4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h3.2L12 19V5L7.2 9H4z"/><path d="M16 9.6l5 4.8M21 9.6l-5 4.8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';

export function createUI() {
  const ui = {
    score:$('score'),
    best:$('best'),
    mapName:$('mapName'),
    coinDisplay:$('coinDisplay'),
    finalCoins:$('finalCoins'),
    overlay:$('overlay'),
    menu:$('screenMenu'),
    pause:$('screenPause'),
    over:$('screenOver'),
    mapsList:$('mapsList'),
    finalScore:$('finalScore'),
    finalBest:$('finalBest'),
    overMsg:$('overMsg'),
    overTitle:$('overTitle'),
    btnPlay:$('btnPlay'),
    btnRestart:$('btnRestart'),
    btnMenu:$('btnMenu'),
    btnPlayMenu:$('btnPlayMenu'),
    btnSound:$('btnSound'),
    helpModal:$('helpModal'),
    skinDisplay:$('skinDisplay'),
    skinPrev:$('skinPrev'),
    skinNext:$('skinNext')
  };

  function refreshSoundBtn() {
    ui.btnSound.innerHTML = Sound.muted ? SOUND_OFF : SOUND_ON;
    ui.btnSound.classList.toggle('muted', Sound.muted);
  }

  function updateHUD(G, pulse) {
    ui.score.textContent = G.score;
    ui.best.textContent = G.best;
    ui.mapName.textContent = MAPS[G.mapKey]?.name || '—';
    if (pulse) {
      ui.score.classList.remove('pulse');
      void ui.score.offsetWidth;
      ui.score.classList.add('pulse');
    }
  }

  function setPlayButton(status) {
    const span = ui.btnPlay.querySelector('span');
    const ic   = ui.btnPlay.querySelector('.ic');
    const cfg = {
      playing:   ['Pausar',    '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'],
      paused:    ['Continuar', '<path d="M8 5v14l11-7z"/>'],
      over:      ['Jogar',     '<path d="M8 5v14l11-7z"/>'],
      countdown: ['Aguarde',   '<path d="M8 5v14l11-7z"/>']
    }[status] || ['Iniciar', '<path d="M8 5v14l11-7z"/>'];
    span.textContent = cfg[0];
    ic.innerHTML = cfg[1];
  }

  function showScreen(which) {
    ui.overlay.classList.remove('hidden');
    ui.menu.classList.toggle('hidden',  which !== 'menu');
    ui.pause.classList.toggle('hidden', which !== 'pause');
    ui.over.classList.toggle('hidden',  which !== 'over');
  }

  function hideOverlay() {
    ui.overlay.classList.add('hidden');
  }

  function renderMenu(selectedKey, onPick) {
    ui.mapsList.innerHTML = '';
    for (const [key, m] of Object.entries(MAPS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-card' + (key === selectedKey ? ' selected' : '');
      btn.innerHTML =
        `<span class="map-icon">${ICONS[m.icon] || ''}</span>` +
        `<span class="map-info"><strong>${m.name}</strong><small>${m.desc}</small></span>` +
        `<span class="map-best">${m.random ? '∞' : getBest(key)}</span>`;
      btn.addEventListener('click', () => onPick(key));
      ui.mapsList.appendChild(btn);
    }
  }

  function refreshCoins() {
    const coins = store.getInt('coins', 0);
    if (ui.coinDisplay) ui.coinDisplay.textContent = coins;
  }

  function renderSkinCarousel(skin, index, total, state, handlers) {
    let preview = '';
    for (let i = 0; i < 5; i++) {
      let color;
      if (skin.rainbow) {
        color = `hsl(${i * 55} 88% 60%)`;
      } else {
        const p = i / 4;
        const b = skin.body;
        color = `hsl(${b.h0 + (b.h1 - b.h0) * p} ${b.s0}% ${b.l0 + (b.l1 - b.l0) * p}%)`;
      }
      preview += `<i style="background:${color}"></i>`;
    }

    let action;
    if (!state.unlocked)      action = `<span class="skin-action buy">🪙 ${skin.price} · Comprar</span>`;
    else if (state.active)    action = `<span class="skin-action">✓ Em uso</span>`;
    else                      action = `<span class="skin-action">Usar</span>`;

    ui.skinDisplay.innerHTML = `
      <div class="skin-preview-lg">${preview}</div>
      <div class="skin-name-lg">${skin.name}</div>
      <div class="skin-desc-lg">${skin.desc}</div>
      ${action}
    `;

    ui.skinDisplay.onclick = handlers.onSkinClick;
    ui.skinPrev.disabled = index === 0;
    ui.skinNext.disabled = index === total - 1;
  }

  function flashSkinDisplay(kind) {
    ui.skinDisplay.classList.remove('flash-bad', 'flash-good');
    void ui.skinDisplay.offsetWidth;
    ui.skinDisplay.classList.add(kind === 'good' ? 'flash-good' : 'flash-bad');
    setTimeout(() => ui.skinDisplay.classList.remove('flash-bad', 'flash-good'), 400);
  }

  function showOver({ score, best, newRecord, coins }) {
    ui.finalScore.textContent = score;
    ui.finalBest.textContent = best;
    ui.finalCoins.textContent = coins;
    ui.overTitle.textContent = score > 0 ? 'Fim de jogo' : 'Que pena!';
    ui.overMsg.textContent = newRecord ? 'Novo recorde nesse mapa!' : 'Tente novamente!';
    showScreen('over');
  }

  return {
    ui,
    updateHUD,
    setPlayButton,
    showScreen,
    hideOverlay,
    renderMenu,
    renderSkinCarousel,
    flashSkinDisplay,
    refreshCoins,
    refreshSoundBtn,
    showOver
  };
}