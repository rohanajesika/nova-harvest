// Everything the eye sees: the nebula sky, the lantern-moth, the wisps, the boss, the
// HUD and every screen. Drawn on one canvas, scaled from the 1280x720 playfield.
import { BOSS, FIELD, FONT, PALETTE, PLAYER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowCircle(ctx, x, y, radius, inner, outer) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function drawBackground(state, stars) {
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    grad.addColorStop(0, PALETTE.spaceTop);
    grad.addColorStop(1, PALETTE.spaceBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Three soft nebula clouds, fixed in place.
    glowCircle(ctx, 250, 150, 260, 'rgba(59,29,94,0.55)', 'rgba(59,29,94,0)');
    glowCircle(ctx, 1020, 110, 230, 'rgba(14,58,92,0.5)', 'rgba(14,58,92,0)');
    glowCircle(ctx, 900, 620, 280, 'rgba(92,29,58,0.42)', 'rgba(92,29,58,0)');
    glowCircle(ctx, 180, 600, 200, 'rgba(14,58,92,0.35)', 'rgba(14,58,92,0)');
    for (const star of stars) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(state.time * star.twinkle + star.phase));
      ctx.globalAlpha = tw * star.depth;
      ctx.fillStyle = PALETTE.star;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSeed(seed) {
    const pulse = 1 + 0.18 * Math.sin(seed.spin * 3);
    glowCircle(ctx, seed.x, seed.y, 26 * pulse, 'rgba(255,159,28,0.5)', 'rgba(255,159,28,0)');
    ctx.save();
    ctx.translate(seed.x, seed.y);
    ctx.rotate(seed.spin * 0.4);
    ctx.fillStyle = PALETTE.seed;
    ctx.beginPath();
    ctx.moveTo(0, -11 * pulse);
    ctx.quadraticCurveTo(8 * pulse, 0, 0, 11 * pulse);
    ctx.quadraticCurveTo(-8 * pulse, 0, 0, -11 * pulse);
    ctx.fill();
    ctx.fillStyle = '#fff8e1';
    ctx.beginPath();
    ctx.arc(-2, -3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWisp(wisp) {
    const colour = wisp.elite ? PALETTE.elite : PALETTE.wisp;
    const core = wisp.elite ? '#ffd166' : PALETTE.wispCore;
    glowCircle(ctx, wisp.x, wisp.y, wisp.radius * 2.4, wisp.flash > 0 ? 'rgba(255,255,255,0.75)' : hexA(colour, 0.45), hexA(colour, 0));
    ctx.fillStyle = wisp.flash > 0 ? '#ffffff' : colour;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, wisp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(wisp.x - wisp.radius * 0.25, wisp.y - wisp.radius * 0.2, wisp.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    // Two eyes that track the player.
    ctx.fillStyle = '#1a0b2e';
    ctx.beginPath();
    ctx.arc(wisp.x - wisp.radius * 0.32, wisp.y - wisp.radius * 0.05, wisp.radius * 0.16, 0, Math.PI * 2);
    ctx.arc(wisp.x + wisp.radius * 0.32, wisp.y - wisp.radius * 0.05, wisp.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    if (wisp.elite) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, wisp.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function hexA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function drawBoss(boss) {
    const pulse = 1 + 0.05 * Math.sin(boss.angle * 2);
    glowCircle(ctx, boss.x, boss.y, boss.radius * 2.6, 'rgba(142,45,226,0.55)', 'rgba(142,45,226,0)');
    ctx.fillStyle = boss.flash > 0 ? '#ffffff' : PALETTE.boss;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e07bff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius * 0.72 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    // A single glaring eye.
    ctx.fillStyle = '#ff5d8f';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y - 6, boss.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0b2e';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y - 6, boss.radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
    // Crown spikes.
    ctx.fillStyle = PALETTE.boss;
    for (let i = -2; i <= 2; i += 1) {
      const sx = boss.x + i * boss.radius * 0.34;
      ctx.beginPath();
      ctx.moveTo(sx - 10, boss.y - boss.radius * 0.82);
      ctx.lineTo(sx, boss.y - boss.radius * 1.25);
      ctx.lineTo(sx + 10, boss.y - boss.radius * 0.82);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(BOSS.name.toUpperCase(), boss.x, boss.y + boss.radius + 30);
  }

  function drawPlayer(player) {
    if (player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0) return;
    // Trail.
    for (let i = 0; i < player.trail.length; i += 1) {
      const t = player.trail[i];
      const alpha = (i / player.trail.length) * 0.35;
      ctx.fillStyle = `rgba(255,209,102,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 6 + i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (player.shield > 0) {
      ctx.strokeStyle = 'rgba(79,195,247,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER.radius + 12 + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    glowCircle(ctx, player.x, player.y, 54, 'rgba(255,209,102,0.5)', 'rgba(255,209,102,0)');
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    // Lantern-moth wings.
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -22, -30, -14);
    ctx.quadraticCurveTo(-18, 0, 0, 0);
    ctx.quadraticCurveTo(-14, 22, -30, 14);
    ctx.quadraticCurveTo(-18, 0, 0, 0);
    ctx.fill();
    // Body: a little lantern.
    ctx.fillStyle = PALETTE.playerCore;
    ctx.beginPath();
    ctx.ellipse(4, 0, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8d5a00';
    ctx.fillRect(14, -5, 5, 10);
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(16, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (player.magnetTimer > 0) {
      ctx.strokeStyle = 'rgba(105,240,174,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER.magnetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawPowerup(power) {
    const bob = Math.sin(power.bob) * 3;
    const colours = { shield: '#4fc3f7', magnet: '#69f0ae', rapid: '#ff8a65' };
    const colour = colours[power.power];
    glowCircle(ctx, power.x, power.y + bob, 30, hexA(colour, 0.5), hexA(colour, 0));
    ctx.fillStyle = '#0b1026';
    ctx.beginPath();
    ctx.arc(power.x, power.y + bob, power.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph = power.power === 'shield' ? 'S' : power.power === 'magnet' ? 'M' : 'R';
    ctx.fillText(glyph, power.x, power.y + bob + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  function drawHud(state, best, muted) {
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 14, 12, 560, 54, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 26px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${state.score}`, 30, 46);
    ctx.font = `400 15px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`BEST ${Math.max(best, state.score)}`, 30, 62 - 2);
    // Hearts.
    for (let i = 0; i < 3; i += 1) {
      const x = 430 + i * 34;
      const y = 39;
      ctx.fillStyle = i < state.lives ? PALETTE.heart : PALETTE.heartEmpty;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 12, x, y - 4);
      ctx.bezierCurveTo(x + 6, y - 12, x + 12, y - 4, x, y + 8);
      ctx.fill();
    }
    // Wave + seeds, right side.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, FIELD.width - 330, 12, 316, 54, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`WAVE ${state.wave} / 8`, FIELD.width - 30, 34);
    ctx.font = `400 15px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`✦ ${state.seedsCollected} seeds   ☠ ${state.wispsDown} wisps`, FIELD.width - 30, 56);
    // Combo meter.
    if (state.combo > 1) {
      const w = 180;
      const frac = state.comboTimer / 2.5;
      ctx.fillStyle = PALETTE.panel;
      roundRect(ctx, 14, 76, w + 16, 34, 10);
      ctx.fill();
      ctx.fillStyle = '#ff9f1c';
      roundRect(ctx, 22, 84, w * frac, 18, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 15px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`COMBO ×${state.combo}`, 208, 99);
    }
    // Active power-up timers.
    let ty = 120;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'left';
    if (state.player.shield > 0) {
      ctx.fillStyle = '#4fc3f7';
      ctx.fillText('◈ SHIELD', 22, ty);
      ty += 22;
    }
    if (state.player.magnetTimer > 0) {
      ctx.fillStyle = '#69f0ae';
      ctx.fillText(`✦ MAGNET ${Math.ceil(state.player.magnetTimer)}s`, 22, ty);
      ty += 22;
    }
    if (state.player.rapidTimer > 0) {
      ctx.fillStyle = '#ff8a65';
      ctx.fillText(`≫ RAPID ${Math.ceil(state.player.rapidTimer)}s`, 22, ty);
    }
    // Boss bar.
    if (state.boss) {
      const bw = 420;
      const bx = (FIELD.width - bw) / 2;
      const by = FIELD.height - 44;
      ctx.fillStyle = 'rgba(10,14,34,0.8)';
      roundRect(ctx, bx - 10, by - 10, bw + 20, 34, 10);
      ctx.fill();
      ctx.fillStyle = '#3a1040';
      roundRect(ctx, bx, by, bw, 14, 7);
      ctx.fill();
      ctx.fillStyle = '#e07bff';
      roundRect(ctx, bx, by, bw * Math.max(0, state.boss.hp / state.boss.maxHp), 14, 7);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${BOSS.name.toUpperCase()}  ${Math.max(0, state.boss.hp)} / ${state.boss.maxHp}`, FIELD.width / 2, by - 16);
    }
    // Controls hint + mute state.
    ctx.fillStyle = 'rgba(238,241,245,0.75)';
    ctx.font = `400 13px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`WASD / arrows move · mouse aim · hold click / Space to shoot · P pause · M ${muted ? 'unmute' : 'mute'}`, FIELD.width - 14, FIELD.height - 14);
    ctx.textAlign = 'left';
  }

  function panel(title, lines, accent) {
    const w = 620;
    const h = 130 + lines.length * 34;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = 'rgba(5, 8, 22, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(title, FIELD.width / 2, y + 62);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 19px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, FIELD.width / 2, y + 108 + i * 34);
    });
    return { x, y, w, h };
  }

  function draw(state, screen, best, muted, stars) {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawBackground(state, stars);
    for (const seed of state.seeds) drawSeed(seed);
    for (const power of state.powerups) drawPowerup(power);
    for (const orb of state.orbs) {
      glowCircle(ctx, orb.x, orb.y, 22, 'rgba(224,123,255,0.55)', 'rgba(224,123,255,0)');
      ctx.fillStyle = PALETTE.orb;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const wisp of state.wisps) drawWisp(wisp);
    if (state.boss) drawBoss(state.boss);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawPlayer(state.player);
    for (const bolt of state.bolts) {
      glowCircle(ctx, bolt.x, bolt.y, 14, 'rgba(255,224,102,0.7)', 'rgba(255,224,102,0)');
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, bolt.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      ctx.fillStyle = f.colour;
      ctx.font = `700 17px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(5, 8, 22, 0.45)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      glowCircle(ctx, FIELD.width / 2, 250, 190, 'rgba(255,209,102,0.35)', 'rgba(255,209,102,0)');
      ctx.fillStyle = '#ffd166';
      ctx.font = `700 84px ${FONT}`;
      ctx.fillText('NOVA HARVEST', FIELD.width / 2, 235);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `400 24px ${FONT}`;
      ctx.fillText('Guide your lantern-moth through the gloom. Gather star-seeds,', FIELD.width / 2, 290);
      ctx.fillText('blast the wisps, and banish the Gloomheart.', FIELD.width / 2, 322);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 19px ${FONT}`;
      ctx.fillText('WASD / arrows to fly  ·  mouse to aim  ·  hold click or Space to shoot', FIELD.width / 2, 380);
      ctx.fillText('Seeds build your combo · 3 hull hearts · clear 8 waves to win', FIELD.width / 2, 410);
      if (best > 0) {
        ctx.fillStyle = '#ffd166';
        ctx.font = `700 20px ${FONT}`;
        ctx.fillText(`BEST SCORE  ${best}`, FIELD.width / 2, 452);
      }
      const pulse = 0.65 + 0.35 * Math.sin(state.time * 3);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#fff3c4';
      ctx.font = `700 26px ${FONT}`;
      ctx.fillText('PRESS SPACE OR CLICK TO START', FIELD.width / 2, 520);
      ctx.globalAlpha = 1;
    } else if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHud(state, best, muted);
      if (screen === SCREEN_PAUSED) {
        panel('PAUSED', ['Press P or Space to keep flying.', 'M toggles sound.'], '#4fc3f7');
      }
    } else if (screen === SCREEN_OVER) {
      drawHud(state, best, muted);
      panel('THE GLOOM TAKES YOU', [
        `Score ${state.score}   ·   Best ${Math.max(best, state.score)}`,
        `You reached wave ${state.wave}  ·  ${state.seedsCollected} seeds gathered`,
        'Press Space, click, or R to fly again.',
      ], '#ff5252');
    } else if (screen === SCREEN_WIN) {
      drawHud(state, best, muted);
      panel('THE GLOOM IS BANISHED!', [
        `Score ${state.score}   ·   Best ${Math.max(best, state.score)}`,
        `All 8 waves cleared  ·  ${state.seedsCollected} seeds  ·  ${state.wispsDown} wisps down`,
        'Press Space, click, or R to fly again.',
      ], '#ffd166');
    }
    ctx.restore();
  }

  return { draw };
}
