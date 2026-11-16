// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 16,
  accel: 2600,
  maxSpeed: 420,
  drag: 3.2,
  fireInterval: 0.16,
  rapidFireInterval: 0.08,
  boltSpeed: 720,
  invulnerable: 1.6,
  magnetRadius: 170,
};

export const LIVES = 3;

/** A wave is cleared once this many wisps have been destroyed in it. */
export const WAVE = {
  seconds: 26,
  max: 8,
  killQuota: [0, 6, 9, 12, 15, 18, 22, 26, 0],
  spawnInterval: [0, 1.5, 1.35, 1.2, 1.05, 0.92, 0.8, 0.7, 0.6],
  wispSpeed: [0, 95, 105, 115, 128, 140, 152, 165, 180],
  wispHp: [0, 1, 1, 1, 2, 2, 2, 3, 3],
  eliteEvery: 5,
};

export const SEED = {
  radius: 9,
  fallSpeed: 70,
  sway: 42,
  spawnInterval: 0.85,
  points: 10,
  comboWindow: 2.5,
  maxCombo: 8,
};

export const WISP = {
  radius: 15,
  eliteRadius: 22,
  points: 25,
  elitePoints: 100,
  contactDamage: 1,
};

export const BOLT = { radius: 5, damage: 1, life: 1.4 };

export const BOSS = {
  name: 'Gloomheart',
  radius: 58,
  hp: 90,
  points: 1000,
  burstInterval: 3.2,
  burstCount: 8,
  orbSpeed: 150,
  orbRadius: 8,
  minionEvery: 8,
};

export const POWERUP = {
  radius: 14,
  kinds: ['shield', 'magnet', 'rapid'],
  shieldHits: 1,
  magnetSeconds: 8,
  rapidSeconds: 10,
  dropChance: 0.09,
};

export const PARTICLES = { max: 320 };

export const PALETTE = {
  spaceTop: '#0b1026',
  spaceBottom: '#1c0f33',
  nebulaA: '#3b1d5e',
  nebulaB: '#0e3a5c',
  nebulaC: '#5c1d3a',
  star: '#dfe8ff',
  player: '#ffd166',
  playerCore: '#fff3c4',
  bolt: '#ffe066',
  seed: '#ffd166',
  seedGlow: '#ff9f1c',
  wisp: '#b388ff',
  wispCore: '#7b2ff7',
  elite: '#ff5d8f',
  boss: '#8e2de2',
  orb: '#e07bff',
  shield: '#4fc3f7',
  magnet: '#69f0ae',
  rapid: '#ff8a65',
  panel: 'rgba(10, 14, 34, 0.72)',
  panelEdge: 'rgba(150, 170, 255, 0.35)',
  text: '#eef1f5',
  muted: '#9aa5c0',
  heart: '#ff5d73',
  heartEmpty: '#3a4157',
  danger: '#ff5252',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'nova-harvest.best';
