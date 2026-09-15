
export const COLS = 20;
export const ROWS = 20;
export const CELL = 24;
export const W = COLS * CELL;
export const H = ROWS * CELL;

export const BASE_SPEED = 190;
export const MIN_SPEED  = 90;
export const ACCEL      = 0.18;
export const WARMUP     = 5;

export const BONUS_TTL    = 8000;
export const BONUS_CHANCE = 0.3;
export const EMPTY_ROW    = '.'.repeat(COLS);

export function computeSpeed(score) {
  if (score < WARMUP) return BASE_SPEED;
  const eff = score - WARMUP;
  return Math.max(MIN_SPEED, BASE_SPEED - eff * ACCEL);
}

export const SKINS = {
  classic: {
    id:'classic', name:'Clássica', desc:'O verde de sempre', price:0,
    head:['#86efac','#22c55e'],
    body:{ h0:138, h1:90, s0:72, s1:68, l0:58, l1:36 },
    glow:'rgba(74,222,128,.95)'
  },
  neon: {
    id:'neon', name:'Neon', desc:'Brilha no escuro', price:50,
    head:['#a5f3fc','#06b6d4'],
    body:{ h0:190, h1:260, s0:95, s1:90, l0:65, l1:50 },
    glow:'rgba(103,232,249,.95)'
  },
  fogo: {
    id:'fogo', name:'Fogo', desc:'Cauda em chamas', price:120,
    head:['#fde68a','#f97316'],
    body:{ h0:48, h1:0, s0:95, s1:90, l0:65, l1:42 },
    glow:'rgba(251,146,60,.95)'
  },
  roxo: {
    id:'roxo', name:'Nebulosa', desc:'Cósmica e misteriosa', price:180,
    head:['#e9d5ff','#a855f7'],
    body:{ h0:280, h1:220, s0:80, s1:75, l0:65, l1:42 },
    glow:'rgba(168,85,247,.95)'
  },
  arcoiris: {
    id:'arcoiris', name:'Arco-íris', desc:'Todas as cores', price:300,
    rainbow:true,
    head:['#fef08a','#f472b6'],
    body:{ h0:0, h1:0, s0:88, s1:88, l0:62, l1:50 },
    glow:'rgba(244,114,182,.95)'
  },
  ouro: {
    id:'ouro', name:'Lendária', desc:'Só para mestres', price:600,
    head:['#fff7d6','#f59e0b'],
    body:{ h0:45, h1:35, s0:85, s1:80, l0:68, l1:45 },
    glow:'rgba(251,191,36,.95)'
  }
};

export const ICONS = {
  portal:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M16 4.5a11.5 11.5 0 1 1-8.15 3.35"/><path d="M16 10.5a5.5 5.5 0 1 1-3.9 1.65"/><circle cx="16" cy="16" r="1.9" fill="currentColor" stroke="none"/></svg>',
  leaf:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M25.5 6.5C13 6.5 6.5 13 6.5 25.5c12.5 0 19-6.5 19-19z"/><path d="M6.5 25.5C11 20.5 16 15.5 22 11.5"/></svg>',
  rock:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M6.5 23.5 9 12.5 17.5 7l8 5.5-1.5 11z"/><path d="M9 12.5 15.5 17l10-4.5"/></svg>',
  mushroom:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M4 17.5C4 10.6 9.4 6 16 6s12 4.6 12 11.5z"/><path d="M12 17.5v6.5a4 4 0 0 0 8 0v-6.5"/></svg>',
  dice:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="5" y="5" width="22" height="22" rx="4"/><circle cx="11" cy="11" r="1.6" fill="currentColor"/><circle cx="21" cy="11" r="1.6" fill="currentColor"/><circle cx="16" cy="16" r="1.6" fill="currentColor"/><circle cx="11" cy="21" r="1.6" fill="currentColor"/><circle cx="21" cy="21" r="1.6" fill="currentColor"/></svg>'
};

const EMPTY_MAP = Array.from({ length: ROWS }, () => EMPTY_ROW);

export const MAPS = {
  livre: {
    name:'Campo Livre', icon:'leaf',
    desc:'Sem obstáculos. Corra à vontade.',
    wrapEnabled:true, layout:EMPTY_MAP
  },
  portais: {
    name:'Portais', icon:'portal',
    desc:'Paredes com buracos que se conectam.',
    wrapEnabled:false,
    layout:[
      '#########OO#########',
      '#..................#','#..................#','#..................#',
      '#..................#','#..................#','#..................#',
      '#..................#','#..................#',
      'O..................O','O..................O',
      '#..................#','#..................#','#..................#',
      '#..................#','#..................#','#..................#',
      '#..................#','#..................#',
      '#########OO#########'
    ],
    portals:{
      '9,0':{x:9,y:19},'10,0':{x:10,y:19},
      '9,19':{x:9,y:0},'10,19':{x:10,y:0},
      '0,9':{x:19,y:9},'0,10':{x:19,y:10},
      '19,9':{x:0,y:9},'19,10':{x:0,y:10}
    }
  },
  obstaculos: {
    name:'Obstáculos', icon:'rock',
    desc:'Blocos espalhados pelo campo.',
    wrapEnabled:true,
    layout:[
      '....................','....................',
      '....####....####....','....#..........#....','....#..........#....',
      '....................','....................',
      '..###..........###..','..###..........###..',
      '....................','....................','....................',
      '..###..........###..','..###..........###..',
      '....................','....................',
      '....#..........#....','....#..........#....',
      '....####....####....','....................'
    ]
  },
  labirinto: {
    name:'Labirinto', icon:'mushroom',
    desc:'Pilares por toda parte. Cuidado!',
    wrapEnabled:true,
    layout:[
      '....................','..####..####..####..','....................',
      '..#....#....#....#..','..#....#....#....#..','....................',
      '..####..####..####..','....................',
      '..#....#....#....#..','..#....#....#....#..','....................',
      '....................',
      '..#....#....#....#..','..#....#....#....#..','....................',
      '..####..####..####..','....................',
      '..#....#....#....#..','..#....#....#....#..','....................'
    ]
  },
  cruz: {
    name:'A Cruz', icon:'rock',
    desc:'Quatro braços e um centro perigoso.',
    wrapEnabled:true,
    layout:[
      '....................','....................','....................',
      '.........####.......','.........####.......','.........####.......',
      '.....############...','.....############...','.....############...',
      '.....############...','.....############...','.....############...',
      '.........####.......','.........####.......','.........####.......',
      '....................','....................','....................',
      '....................','....................'
    ]
  },
  aleatorio: {
    name:'Aleatório', icon:'dice',
    desc:'Um mapa novo a cada partida.',
    wrapEnabled:true, layout:EMPTY_MAP, random:true
  }
};