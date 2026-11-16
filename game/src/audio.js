// All sound is synthesised with WebAudio: no audio files, no network. A tiny ambient pad
// loops under play; every action has its own short blip, chime or burst.
export function createAudio() {
  let context = null;
  let master = null;
  let padNodes = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!ensure() || muted) return;
    const t0 = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, filterFreq, delay = 0) {
    if (!ensure() || muted) return;
    const t0 = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * dur));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = context.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t0);
  }

  function startPad() {
    if (!ensure() || muted || padNodes) return;
    const gain = context.createGain();
    gain.gain.value = 0.045;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    gain.connect(filter);
    filter.connect(master);
    const oscs = [110, 164.81, 220].map((freq, i) => {
      const osc = context.createOscillator();
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = i === 1 ? 4 : -3;
      osc.connect(gain);
      osc.start();
      return osc;
    });
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    padNodes = { gain, oscs, lfo };
  }

  function stopPad() {
    if (!padNodes) return;
    try {
      padNodes.gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.4);
      const nodes = padNodes;
      window.setTimeout(() => {
        nodes.oscs.forEach((osc) => {
          try {
            osc.stop();
          } catch {
            // Already stopped.
          }
        });
        try {
          nodes.lfo.stop();
        } catch {
          // Already stopped.
        }
      }, 500);
    } catch {
      // Audio already gone.
    }
    padNodes = null;
  }

  return {
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.5;
      if (muted) stopPad();
      else if (padNodes) {
        // Pad restarts on the next play start.
      }
    },
    isMuted() {
      return muted;
    },
    startMusic() {
      startPad();
    },
    stopMusic() {
      stopPad();
    },
    shoot() {
      tone(880, 0.09, 'square', 0.08, 320);
    },
    pickup(combo) {
      const base = 620 + Math.min(combo, 8) * 55;
      tone(base, 0.12, 'sine', 0.16, base * 1.6);
      tone(base * 2, 0.1, 'sine', 0.07, base * 2.4, 0.03);
    },
    wispDown() {
      noise(0.22, 0.22, 900);
      tone(220, 0.18, 'sawtooth', 0.1, 55);
    },
    hit() {
      noise(0.3, 0.3, 500);
      tone(160, 0.3, 'sawtooth', 0.18, 45);
    },
    powerup() {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.14, 'triangle', 0.12, null, i * 0.06));
    },
    waveClear() {
      [392, 523, 659, 784].forEach((freq, i) => tone(freq, 0.18, 'triangle', 0.12, null, i * 0.07));
    },
    bossRoar() {
      tone(98, 0.7, 'sawtooth', 0.2, 55);
      noise(0.6, 0.18, 300);
    },
    victory() {
      [523, 659, 784, 1047, 1319].forEach((freq, i) => tone(freq, 0.3, 'triangle', 0.14, null, i * 0.11));
    },
    gameOver() {
      [392, 330, 262, 196].forEach((freq, i) => tone(freq, 0.32, 'triangle', 0.13, null, i * 0.14));
    },
  };
}
