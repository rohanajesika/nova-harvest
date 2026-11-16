// The screenshot scenes behind ?shot=start|play|boss|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a simple autopilot
// (chase the nearest seed, keep clear of wisps, fire at the nearest wisp), so the frame is
// what a short game really looks like and the same seed always gives the same frame.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const BOSS_SECONDS = 9;
const WIN_SECONDS = 40;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** Steer toward the nearest seed, pushed away from close wisps, and fire while playing. */
function autopilot(world) {
  const state = world.state;
  const player = state.player;
  let mx = 0;
  let my = 0;
  let seed = null;
  let seedScore = Infinity;
  for (const s of state.seeds) {
    const d = Math.hypot(s.x - player.x, s.y - player.y);
    // Prefer seeds in the open field: skip ones still behind the HUD strip at the top,
    // and ones about to fall off the floor, so the moth stays in view.
    const score = d + (s.y < 170 ? 400 : 0) + (s.y > FIELD.height * 0.72 ? 260 : 0);
    if (score < seedScore) {
      seedScore = score;
      seed = s;
    }
  }
  if (seed) {
    mx += (seed.x - player.x) / Math.max(60, Math.hypot(seed.x - player.x, seed.y - player.y));
    my += (seed.y - player.y) / Math.max(60, Math.hypot(seed.x - player.x, seed.y - player.y));
  } else {
    mx += (FIELD.width / 2 - player.x) / 400;
    my += (FIELD.height / 2 - player.y) / 400;
  }
  // Keep off the edges: a moth pinned to a corner reads badly and traps itself.
  // The top edge is deeper so the moth never hides behind the HUD panels.
  const edge = 110;
  const topEdge = 150;
  if (player.x < edge) mx += (edge - player.x) / edge;
  if (player.x > FIELD.width - edge) mx -= (player.x - (FIELD.width - edge)) / edge;
  if (player.y < topEdge) my += (topEdge - player.y) / topEdge;
  if (player.y > FIELD.height - edge) my -= (player.y - (FIELD.height - edge)) / edge;
  // Drift back toward the middle of the field when nothing urgent pulls elsewhere.
  mx += (FIELD.width / 2 - player.x) / 2600;
  my += (FIELD.height * 0.52 - player.y) / 2600;
  // During the boss fight, hold a firing lane below the boss instead of chasing seeds.
  if (state.boss) {
    const lx = state.boss.x - player.x;
    const ly = state.boss.y + 260 - player.y;
    const ld = Math.max(60, Math.hypot(lx, ly));
    mx += (lx / ld) * 1.6;
    my += (ly / ld) * 1.6;
  }
  const threats = [...state.wisps, ...state.orbs];
  if (state.boss) threats.push(state.boss);
  for (const threat of threats) {
    const dx = player.x - threat.x;
    const dy = player.y - threat.y;
    const d = Math.hypot(dx, dy);
    const range = 150;
    if (d < range && d > 1) {
      const push = ((range - d) / range) * 2.4;
      mx += (dx / d) * push;
      my += (dy / d) * push;
    }
  }
  const length = Math.hypot(mx, my);
  const move = length > 0.01 ? { x: mx / length, y: my / length } : { x: 0, y: 0 };
  return { move, fire: true };
}

/** A careless pilot: it only chases seeds and never fires, so the wisps catch it. */
function carelessPilot(world) {
  const state = world.state;
  const player = state.player;
  let seed = null;
  let seedDist = Infinity;
  for (const s of state.seeds) {
    const d = (s.x - player.x) ** 2 + (s.y - player.y) ** 2;
    if (d < seedDist) {
      seedDist = d;
      seed = s;
    }
  }
  if (!seed) return { move: { x: 0, y: 0 }, fire: false };
  const dx = seed.x - player.x;
  const dy = seed.y - player.y;
  const length = Math.hypot(dx, dy);
  return { move: length > 1 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 }, fire: false };
}

function aimAt(state) {
  const target = worldNearest(state);
  return target ? { x: target.x, y: target.y, moved: true } : { x: FIELD.width / 2, y: 200, moved: true };
}

function worldNearest(state) {
  // During the boss fight, keep the light on the boss unless a wisp is right on top of us.
  if (state.boss) {
    let closeWisp = null;
    let closeDist = 130 * 130;
    for (const wisp of state.wisps) {
      const d = (wisp.x - state.player.x) ** 2 + (wisp.y - state.player.y) ** 2;
      if (d < closeDist) {
        closeDist = d;
        closeWisp = wisp;
      }
    }
    if (!closeWisp) return state.boss;
    return closeWisp;
  }
}

function simulate(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    const { move, fire } = pilot(world);
    const events = world.step(STEP, move, fire, aimAt(world.state), true);
    if (events & (EVENT_OVER | EVENT_WIN)) break;
  }
}

/**
 * Set `world` to the named scene (start, play, boss or end; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    simulate(world, PLAY_SECONDS, autopilot);
    const over = world.state.over;
    const won = world.state.won;
    return { screen: over ? SCREEN_OVER : won ? SCREEN_WIN : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'boss') {
    world.state.wave = 8;
    world.startBoss();
    world.state.boss.hp = world.state.boss.maxHp;
    simulate(world, BOSS_SECONDS, autopilot);
    const over = world.state.over;
    const won = world.state.won;
    return { screen: over ? SCREEN_OVER : won ? SCREEN_WIN : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'win') {
    world.state.wave = 8;
    world.startBoss();
    world.state.boss.hp = 2;
    simulate(world, WIN_SECONDS, autopilot);
    const over = world.state.over;
    const won = world.state.won;
    return { screen: over ? SCREEN_OVER : won ? SCREEN_WIN : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    simulate(world, END_LIMIT_SECONDS, carelessPilot);
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  for (let index = 0; index < START_SECONDS / STEP; index += 1) world.attract(STEP);
  return { screen: SCREEN_TITLE, best: 0 };
}
