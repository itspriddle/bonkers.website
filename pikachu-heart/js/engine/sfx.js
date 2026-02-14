// Web Audio API synth for 8-bit sound effects
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const sfx = {
  menuSelect() {
    playTone(600, 0.08, 'square', 0.1);
  },

  menuConfirm() {
    playTone(800, 0.06, 'square', 0.12);
    setTimeout(() => playTone(1000, 0.08, 'square', 0.12), 60);
  },

  attack() {
    playNoise(0.12, 0.15);
    playTone(200, 0.15, 'sawtooth', 0.1);
  },

  hit() {
    playTone(120, 0.2, 'square', 0.15);
    playNoise(0.08, 0.12);
  },

  enemyFaint() {
    const notes = [400, 300, 200, 100];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'square', 0.12), i * 100));
  },

  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'square', 0.12), i * 150));
  },

  textBlip() {
    playTone(880, 0.03, 'square', 0.04);
  },

  hiss() {
    playNoise(0.3, 0.15);
  },

  transition() {
    playTone(300, 0.3, 'sawtooth', 0.08);
    playTone(600, 0.3, 'sine', 0.05);
  },

  heal() {
    const notes = [400, 500, 600, 800];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'sine', 0.1), i * 80));
  },

  battleStart() {
    playTone(200, 0.1, 'square', 0.12);
    setTimeout(() => playTone(400, 0.1, 'square', 0.12), 100);
    setTimeout(() => playTone(600, 0.15, 'square', 0.12), 200);
  }
};
