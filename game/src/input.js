// Keyboard and mouse, read once a frame. Movement keys give a unit direction; the mouse
// gives an aim point in playfield coordinates; Space or the mouse button fires.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let firing = false;
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2 - 120, moved: false };

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      firing = true;
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    } else if (event.code === 'KeyR') {
      actions |= ACTION_RESTART;
    }
    if (MOVE_KEYS[event.code]) {
      keys.add(event.code);
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') firing = false;
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    firing = false;
  });
  canvas.addEventListener('mousemove', (event) => {
    const point = toField(event);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.moved = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      firing = true;
      actions |= ACTION_CONFIRM;
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) firing = false;
  });

  return {
    mouse,
    direction() {
      let x = 0;
      let y = 0;
      for (const code of keys) {
        const move = MOVE_KEYS[code];
        if (move) {
          x += move[0];
          y += move[1];
        }
      }
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const length = Math.hypot(x, y);
      return { x: x / length, y: y / length };
    },
    firing() {
      return firing;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
