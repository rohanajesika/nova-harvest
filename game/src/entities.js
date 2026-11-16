// The things that move: the lantern-moth player, wisps, bolts, star-seeds, boss orbs,
// power-ups and the particle bursts that sell every hit. Plain data, moved by world.js.
import { BOLT, BOSS, FIELD, PLAYER, POWERUP, SEED, WISP } from './config.js';

export function createPlayer() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height - 140,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    fireTimer: 0,
    invuln: 0,
    shield: 0,
    magnetTimer: 0,
    rapidTimer: 0,
    trail: [],
  };
}

export function createWisp(random, wave, x, y, elite) {
  const speed = random.range(0.85, 1.15);
  return {
    kind: 'wisp',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: elite ? WISP.eliteRadius : WISP.radius,
    hp: elite ? 3 : 1,
    elite,
    speed,
    wobble: random.angle(),
    wobbleSpeed: random.range(1.5, 3),
    flash: 0,
    wave,
  };
}

export function createBolt(x, y, angle) {
  return {
    kind: 'bolt',
    x,
    y,
    vx: Math.cos(angle) * PLAYER.boltSpeed,
    vy: Math.sin(angle) * PLAYER.boltSpeed,
    radius: BOLT.radius,
    life: BOLT.life,
  };
}

export function createSeed(random, x) {
  return {
    kind: 'seed',
    x,
    y: -20,
    vy: SEED.fallSpeed * random.range(0.8, 1.25),
    swayPhase: random.angle(),
    swaySpeed: random.range(1, 2.2),
    spin: random.angle(),
    radius: SEED.radius,
    value: SEED.points,
  };
}

export function createOrb(x, y, angle) {
  return {
    kind: 'orb',
    x,
    y,
    vx: Math.cos(angle) * BOSS.orbSpeed,
    vy: Math.sin(angle) * BOSS.orbSpeed,
    radius: BOSS.orbRadius,
    life: 6,
  };
}

export function createPowerup(random, x, y) {
  return {
    kind: 'powerup',
    x,
    y,
    vy: 55,
    power: random.pick(POWERUP.kinds),
    radius: POWERUP.radius,
    bob: random.angle(),
    life: 12,
  };
}

export function createBoss(random) {
  return {
    kind: 'boss',
    x: FIELD.width / 2,
    y: 150,
    vx: 60,
    hp: BOSS.hp,
    maxHp: BOSS.hp,
    radius: BOSS.radius,
    burstTimer: 2,
    minionTimer: BOSS.minionEvery,
    flash: 0,
    angle: 0,
  };
}

export function spawnBurst(particles, x, y, colour, count, speed, life = 0.6, size = 3) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.7);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: life * (0.5 + Math.random() * 0.5),
      maxLife: life,
      size: size * (0.6 + Math.random() * 0.8),
      colour,
    });
  }
}

export function spawnTrail(particles, x, y, colour) {
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 20,
    vy: (Math.random() - 0.5) * 20 + 30,
    life: 0.4,
    maxLife: 0.4,
    size: 2.5,
    colour,
  });
}
