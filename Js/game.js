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
    G.acc = 0;          // <<< aqui
    G.particles = [];   // <<< aqui
    G.shake = 0;
    G.best = getBest(mapKey);

    G.status = 'countdown';
    G.countdown = 3.2;

    G.apple = randomFreeCell();
    Sound.unlock();
    Sfx.start();
    onScoreChange?.();
  }
