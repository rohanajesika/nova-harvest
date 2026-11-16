// The simulation: waves of wisps, falling star-seeds, the Gloomheart boss on wave 8,
// scoring with a combo, power-ups, and the win/lose conditions. Pure logic, no drawing.
import {
  BOLT,
  BOSS,
  FIELD,
  PARTICLES,
  PLAYER,
  POWERUP,
  SEED,
  STEP,
  WAVE,
  WISP,
} from './config.js';
import {
  createBoss,
  createBolt,
  createOrb,
  createPlayer,
  createPowerup,
  createSeed,
  createWisp,
  spawnBurst,
  spawnTrail,
} from './entities.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_WAVE = 8;
export const EVENT_BOSS = 16;

export function createWorld(random, audio) {
  const state = freshState();
  const stars = [];
  for (let i = 0; i < 130; i += 1) {
    stars.push({
      x: random.range(0, FIELD.width),
      y: random.range(0, FIELD.height),
      r: random.range(0.6, 2.2),
      twinkle: random.range(0.5, 2.5),
      phase: random.angle(),
      depth: random.range(0.3, 1),
    });
  }

  function freshState() {
    return {
      player: createPlayer(),
      wisps: [],
      bolts: [],
      seeds: [],
      orbs: [],
      powerups: [],
      particles: [],
      floaters: [],
      boss: null,
      score: 0,
      best: 0,
      seedsCollected: 0,
      wispsDown: 0,
      lives: 3,
      wave: 1,
      waveKills: 0,
      waveTime: 0,
      combo: 0,
      comboTimer: 0,
      spawnTimer: 0.6,
      seedTimer: 0.4,
      shake: 0,
      time: 0,
      won: false,
      over: false,
      bossWarned: false,
      bossAnnounced: false,
      killsThisWave: 0,
    };
  }

  function addFloater(x, y, text, colour) {
    state.floaters.push({ x, y, text, colour, life: 1.1, maxLife: 1.1 });
  }

  function addScore(points, x, y, label) {
    state.score += points;
    if (label) addFloater(x, y, label, '#ffe066');
  }

  function spawnWisp() {
    const wave = state.wave;
    const elite = state.killsThisWave > 0 && state.killsThisWave % WAVE.eliteEvery === 0;
    const edge = random.int(0, 2);
    let x;
    let y;
    if (edge === 0) {
      x = random.range(40, FIELD.width - 40);
      y = -30;
    } else if (edge === 1) {
      x = -30;
      y = random.range(40, FIELD.height / 2);
    } else {
      x = FIELD.width + 30;
      y = random.range(40, FIELD.height / 2);
    }
    state.wisps.push(createWisp(random, wave, x, y, elite));
  }

  function startBoss() {
    state.boss = createBoss(random);
    state.bossAnnounced = true;
    audio.bossRoar();
    addFloater(FIELD.width / 2, 260, 'GLOOMHEART AWAKENS', '#e07bff');
  }

  function clearWave() {
    const bonus = 100 * state.wave;
    addScore(bonus, state.player.x, state.player.y - 40, `WAVE ${state.wave} CLEAR  +${bonus}`);
    audio.waveClear();
    state.powerups.push(createPowerup(random, random.range(120, FIELD.width - 120), 120));
    if (state.wave >= WAVE.max) return;
    state.wave += 1;
    state.waveKills = 0;
    state.killsThisWave = 0;
    state.waveTime = 0;
    state.spawnTimer = 0.5;
    if (state.wave === WAVE.max) startBoss();
  }

  function hurtPlayer(events) {
    const player = state.player;
    if (player.invuln > 0 || state.over || state.won) return events;
    if (player.shield > 0) {
      player.shield -= 1;
      player.invuln = 1;
      spawnBurst(state.particles, player.x, player.y, '#4fc3f7', 18, 260);
      audio.hit();
      return events | EVENT_HIT;
    }
    state.lives -= 1;
    state.combo = 0;
    state.comboTimer = 0;
    player.invuln = PLAYER.invulnerable;
    state.shake = 14;
    spawnBurst(state.particles, player.x, player.y, '#ff5d73', 26, 340);
    audio.hit();
    if (state.lives <= 0) {
      state.over = true;
      state.shake = 20;
      spawnBurst(state.particles, player.x, player.y, '#ffd166', 60, 420, 1);
      spawnBurst(state.particles, player.x, player.y, '#ff5d73', 40, 300, 0.9);
      audio.gameOver();
      return events | EVENT_HIT | EVENT_OVER;
    }
    return events | EVENT_HIT;
  }

  function destroyWisp(index, events) {
    const wisp = state.wisps[index];
    state.wisps.splice(index, 1);
    state.wispsDown += 1;
    state.waveKills += 1;
    state.killsThisWave += 1;
    const points = wisp.elite ? WISP.elitePoints : WISP.points;
    addScore(points, wisp.x, wisp.y, `+${points}`);
    spawnBurst(state.particles, wisp.x, wisp.y, wisp.elite ? '#ff5d8f' : '#b388ff', wisp.elite ? 26 : 16, 280);
    audio.wispDown();
    if (random.next() < POWERUP.dropChance) {
      state.powerups.push(createPowerup(random, wisp.x, wisp.y));
    }
    return events;
  }

  function fireBolt(aimX, aimY) {
    const player = state.player;
    const angle = Math.atan2(aimY - player.y, aimX - player.x);
    player.angle = angle;
    const nose = PLAYER.radius + 8;
    state.bolts.push(createBolt(player.x + Math.cos(angle) * nose, player.y + Math.sin(angle) * nose, angle));
    audio.shoot();
  }

  function applyPowerup(power) {
    const player = state.player;
    if (power === 'shield') {
      player.shield = POWERUP.shieldHits;
      addFloater(player.x, player.y - 34, 'SHIELD!', '#4fc3f7');
    } else if (power === 'magnet') {
      player.magnetTimer = POWERUP.magnetSeconds;
      addFloater(player.x, player.y - 34, 'STAR MAGNET!', '#69f0ae');
    } else {
      player.rapidTimer = POWERUP.rapidSeconds;
      addFloater(player.x, player.y - 34, 'RAPID LIGHT!', '#ff8a65');
    }
    audio.powerup();
  }

  function nearestWisp(x, y) {
    // During the boss fight, keep the light on the boss unless a wisp is right on top of us.
    if (state.boss) {
      let closeWisp = null;
      let closeDist = 130 * 130;
      for (const wisp of state.wisps) {
        const d = (wisp.x - x) ** 2 + (wisp.y - y) ** 2;
        if (d < closeDist) {
          closeDist = d;
          closeWisp = wisp;
        }
      }
      if (!closeWisp) return state.boss;
      return closeWisp;
    }
    let best = null;
    let bestDist = Infinity;
    for (const wisp of state.wisps) {
      const d = (wisp.x - x) ** 2 + (wisp.y - y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = wisp;
      }
    }
    return best;
  }

  function step(dt, move, firing, aim, autoAim) {
    if (state.over || state.won) {
      updateParticles(dt);
      updateFloaters(dt);
      return state.over ? EVENT_OVER : EVENT_WIN;
    }
    let events = 0;
    const player = state.player;
    state.time += dt;
    state.waveTime += dt;
    state.shake = Math.max(0, state.shake - dt * 30);

    // Player movement with acceleration and drag.
    player.vx += move.x * PLAYER.accel * dt;
    player.vy += move.y * PLAYER.accel * dt;
    const drag = Math.max(0, 1 - PLAYER.drag * dt);
    player.vx *= drag;
    player.vy *= drag;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > PLAYER.maxSpeed) {
      player.vx = (player.vx / speed) * PLAYER.maxSpeed;
      player.vy = (player.vy / speed) * PLAYER.maxSpeed;
    }
    player.x = Math.min(FIELD.width - PLAYER.radius, Math.max(PLAYER.radius, player.x + player.vx * dt));
    player.y = Math.min(FIELD.height - PLAYER.radius, Math.max(PLAYER.radius, player.y + player.vy * dt));
    player.invuln = Math.max(0, player.invuln - dt);
    player.magnetTimer = Math.max(0, player.magnetTimer - dt);
    player.rapidTimer = Math.max(0, player.rapidTimer - dt);
    player.fireTimer -= dt;
    player.trail.push({ x: player.x, y: player.y, life: 0.25 });
    if (player.trail.length > 14) player.trail.shift();
    if (speed > 60 && Math.random() < 0.6) spawnTrail(state.particles, player.x, player.y, '#ffd166');

    // Aim: the mouse when it has moved, else the nearest wisp (keyboard-only play).
    let aimX = aim.x;
    let aimY = aim.y;
    if (!aim.moved || autoAim) {
      const target = nearestWisp(player.x, player.y);
      if (target) {
        aimX = target.x;
        aimY = target.y;
      }
    }
    if (firing && player.fireTimer <= 0) {
      fireBolt(aimX, aimY);
      player.fireTimer = player.rapidTimer > 0 ? PLAYER.rapidFireInterval : PLAYER.fireInterval;
    }

    // Combo decay.
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    // Spawning: seeds drift in steadily; wisps arrive per wave until the quota is met.
    state.seedTimer -= dt;
    if (state.seedTimer <= 0) {
      state.seedTimer = SEED.spawnInterval * random.range(0.7, 1.3);
      state.seeds.push(createSeed(random, random.range(30, FIELD.width - 30)));
    }
    if (!state.boss && state.waveKills < WAVE.killQuota[state.wave]) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = WAVE.spawnInterval[state.wave] * random.range(0.75, 1.25);
        spawnWisp();
      }
    } else if (!state.boss && state.wisps.length === 0 && state.waveKills >= WAVE.killQuota[state.wave]) {
      clearWave();
      events |= EVENT_WAVE;
    }

    // Boss behaviour: drift side to side, radial bursts, minion wisps.
    const boss = state.boss;
    if (boss) {
      boss.angle += dt;
      boss.x += boss.vx * dt;
      if (boss.x < 120 || boss.x > FIELD.width - 120) boss.vx *= -1;
      boss.y = 150 + Math.sin(boss.angle * 0.7) * 34;
      boss.flash = Math.max(0, boss.flash - dt);
      boss.burstTimer -= dt;
      if (boss.burstTimer <= 0) {
        boss.burstTimer = BOSS.burstInterval;
        const base = Math.atan2(player.y - boss.y, player.x - boss.x);
        for (let i = 0; i < BOSS.burstCount; i += 1) {
          const angle = base + (i / BOSS.burstCount) * Math.PI * 2;
          state.orbs.push(createOrb(boss.x, boss.y, angle));
        }
        audio.bossRoar();
      }
      boss.minionTimer -= dt;
      if (boss.minionTimer <= 0) {
        boss.minionTimer = BOSS.minionEvery;
        state.wisps.push(createWisp(random, state.wave, boss.x, boss.y + 60, false));
        state.wisps.push(createWisp(random, state.wave, boss.x, boss.y + 60, false));
      }
    }

    // Seeds: sway down, magnet pulls them in, collect on touch.
    for (let i = state.seeds.length - 1; i >= 0; i -= 1) {
      const seed = state.seeds[i];
      seed.swayPhase += seed.swaySpeed * dt;
      seed.spin += dt * 2;
      seed.x += Math.sin(seed.swayPhase) * SEED.sway * dt;
      seed.y += seed.vy * dt;
      if (player.magnetTimer > 0) {
        const dx = player.x - seed.x;
        const dy = player.y - seed.y;
        const d = Math.hypot(dx, dy);
        if (d < PLAYER.magnetRadius * 2.2 && d > 1) {
          seed.x += (dx / d) * 520 * dt;
          seed.y += (dy / d) * 520 * dt;
        }
      }
      const dx = seed.x - player.x;
      const dy = seed.y - player.y;
      if (dx * dx + dy * dy < (seed.radius + PLAYER.radius) ** 2) {
        state.seeds.splice(i, 1);
        state.seedsCollected += 1;
        state.combo = Math.min(SEED.maxCombo, state.combo + 1);
        state.comboTimer = SEED.comboWindow;
        const points = SEED.points * state.combo;
        addScore(points, seed.x, seed.y, `+${points}`);
        spawnBurst(state.particles, seed.x, seed.y, '#ffd166', 10, 200);
        audio.pickup(state.combo);
        continue;
      }
      if (seed.y > FIELD.height + 30) state.seeds.splice(i, 1);
    }

    // Wisps chase the player with a wobble.
    const wispSpeed = WAVE.wispSpeed[state.wave];
    for (let i = state.wisps.length - 1; i >= 0; i -= 1) {
      const wisp = state.wisps[i];
      wisp.wobble += wisp.wobbleSpeed * dt;
      const dx = player.x - wisp.x;
      const dy = player.y - wisp.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const speed = wispSpeed * wisp.speed * (wisp.elite ? 0.8 : 1);
      wisp.vx += ((dx / d) * speed - wisp.vx) * Math.min(1, 2.2 * dt);
      wisp.vy += ((dy / d) * speed - wisp.vy) * Math.min(1, 2.2 * dt);
      wisp.x += wisp.vx * dt + Math.cos(wisp.wobble) * 26 * dt;
      wisp.y += wisp.vy * dt + Math.sin(wisp.wobble) * 26 * dt;
      wisp.flash = Math.max(0, wisp.flash - dt);
      const pdx = wisp.x - player.x;
      const pdy = wisp.y - player.y;
      if (pdx * pdx + pdy * pdy < (wisp.radius + PLAYER.radius - 4) ** 2) {
        state.wisps.splice(i, 1);
        spawnBurst(state.particles, wisp.x, wisp.y, '#b388ff', 18, 280);
        events = hurtPlayer(events);
        if (events & EVENT_OVER) return events;
      }
    }

    // Boss orbs drift and hurt on touch.
    for (let i = state.orbs.length - 1; i >= 0; i -= 1) {
      const orb = state.orbs[i];
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      orb.life -= dt;
      const dx = orb.x - player.x;
      const dy = orb.y - player.y;
      if (dx * dx + dy * dy < (orb.radius + PLAYER.radius - 4) ** 2) {
        state.orbs.splice(i, 1);
        events = hurtPlayer(events);
        if (events & EVENT_OVER) return events;
        continue;
      }
      if (orb.life <= 0 || orb.x < -40 || orb.x > FIELD.width + 40 || orb.y < -40 || orb.y > FIELD.height + 40) {
        state.orbs.splice(i, 1);
      }
    }

    // Bolts fly straight and pop wisps, orbs and the boss.
    for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
      const bolt = state.bolts[i];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;
      let dead = bolt.life <= 0 || bolt.x < -20 || bolt.x > FIELD.width + 20 || bolt.y < -20 || bolt.y > FIELD.height + 20;
      if (!dead) {
        for (let j = state.wisps.length - 1; j >= 0; j -= 1) {
          const wisp = state.wisps[j];
          const dx = bolt.x - wisp.x;
          const dy = bolt.y - wisp.y;
          if (dx * dx + dy * dy < (bolt.radius + wisp.radius) ** 2) {
            wisp.hp -= BOLT.damage;
            wisp.flash = 0.12;
            spawnBurst(state.particles, bolt.x, bolt.y, '#ffe066', 6, 160);
            dead = true;
            if (wisp.hp <= 0) events = destroyWisp(j, events);
            break;
          }
        }
      }
      if (!dead && boss) {
        const dx = bolt.x - boss.x;
        const dy = bolt.y - boss.y;
        if (dx * dx + dy * dy < (bolt.radius + boss.radius) ** 2) {
          boss.hp -= BOLT.damage;
          boss.flash = 0.12;
          spawnBurst(state.particles, bolt.x, bolt.y, '#e07bff', 8, 200);
          dead = true;
          if (boss.hp <= 0) {
            state.boss = null;
            state.won = true;
            addScore(BOSS.points, boss.x, boss.y, `+${BOSS.points}`);
            spawnBurst(state.particles, boss.x, boss.y, '#e07bff', 70, 460, 1.2, 4);
            spawnBurst(state.particles, boss.x, boss.y, '#ffd166', 50, 380, 1, 4);
            audio.victory();
            return events | EVENT_WIN;
          }
        }
      }
      if (!dead) {
        for (let j = state.orbs.length - 1; j >= 0; j -= 1) {
          const orb = state.orbs[j];
          const dx = bolt.x - orb.x;
          const dy = bolt.y - orb.y;
          if (dx * dx + dy * dy < (bolt.radius + orb.radius) ** 2) {
            state.orbs.splice(j, 1);
            spawnBurst(state.particles, orb.x, orb.y, '#e07bff', 8, 180);
            dead = true;
            break;
          }
        }
      }
      if (dead) state.bolts.splice(i, 1);
    }

    // Power-ups drift down and apply on touch.
    for (let i = state.powerups.length - 1; i >= 0; i -= 1) {
      const power = state.powerups[i];
      power.bob += dt * 3;
      power.y += power.vy * dt;
      power.life -= dt;
      const dx = power.x - player.x;
      const dy = power.y - player.y;
      if (dx * dx + dy * dy < (power.radius + PLAYER.radius) ** 2) {
        state.powerups.splice(i, 1);
        applyPowerup(power.power);
        continue;
      }
      if (power.life <= 0 || power.y > FIELD.height + 30) state.powerups.splice(i, 1);
    }

    updateParticles(dt);
    updateFloaters(dt);
    if (state.particles.length > PARTICLES.max) state.particles.splice(0, state.particles.length - PARTICLES.max);
    return events;
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.max(0, 1 - 2.4 * dt);
      p.vy *= Math.max(0, 1 - 2.4 * dt);
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }

  function updateFloaters(dt) {
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.y -= 34 * dt;
      f.life -= dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
  }

  return {
    state,
    stars,
    reset() {
      const fresh = freshState();
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, fresh);
    },
    step,
    hurtPlayer,
    nearestWisp,
    startBoss,
    /** Drive the world as a demo behind the title screen: seeds fall, wisps drift, nothing hurts. */
    attract(dt) {
      state.time += dt;
      state.seedTimer -= dt;
      if (state.seedTimer <= 0) {
        state.seedTimer = SEED.spawnInterval * random.range(0.7, 1.3);
        state.seeds.push(createSeed(random, random.range(30, FIELD.width - 30)));
      }
      for (let i = state.seeds.length - 1; i >= 0; i -= 1) {
        const seed = state.seeds[i];
        seed.swayPhase += seed.swaySpeed * dt;
        seed.y += seed.vy * dt;
        if (seed.y > FIELD.height + 30) state.seeds.splice(i, 1);
      }
      if (state.wisps.length < 5) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          state.spawnTimer = 1.4;
          spawnWisp();
        }
      }
      for (const wisp of state.wisps) {
        wisp.wobble += wisp.wobbleSpeed * dt;
        wisp.x += Math.cos(wisp.wobble) * 30 * dt;
        wisp.y += 26 * dt;
        if (wisp.y > FIELD.height + 40) {
          wisp.y = -30;
          wisp.x = random.range(40, FIELD.width - 40);
        }
      }
      updateParticles(dt);
      updateFloaters(dt);
    },
  };
}
