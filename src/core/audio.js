import { useUI } from "../store/useUI";

// Tiny generative sound kit (Web Audio). Nothing is downloaded; every voice is synthesised.

let ctx = null;
let master = null;
let noiseBuf = null;

function ensure() {
  if (!useUI.getState().sound) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function env(g, t, a, peak, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
}

function noise(t, dur, type, freq, q, peak, decay) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, 0.004, peak, decay);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5, dur);
}

function tone(t, freq, type, peak, decay, slide = 1) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * slide, t + decay);
  const g = ctx.createGain();
  env(g, t, 0.003, peak, decay);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + decay + 0.05);
}

const VOICES = {
  // dimension snap — a small wooden tick, pitch rising with size (x: 0..1)
  tick: (t, x = 0.5) => {
    tone(t, 900 + x * 900, "triangle", 0.12, 0.05, 0.6);
    noise(t, 0.03, "bandpass", 3200, 4, 0.05, 0.02);
  },
  // swatch dropped onto a part
  pat: (t) => {
    noise(t, 0.2, "lowpass", 900, 0.8, 0.25, 0.14);
    tone(t, 180, "sine", 0.18, 0.18, 0.7);
  },
  // pencil scratch for line drawing
  scratch: (t, x = 1) => noise(t, 0.6 * x, "bandpass", 5200, 1.2, 0.05, 0.45 * x),
  // object settles on the floor
  knock: (t) => {
    tone(t, 120, "sine", 0.35, 0.22, 0.6);
    noise(t, 0.05, "lowpass", 600, 1, 0.12, 0.05);
  },
  // UI click / lamp switch
  click: (t) => {
    noise(t, 0.02, "highpass", 2500, 1, 0.18, 0.015);
    tone(t, 2400, "square", 0.03, 0.02, 0.5);
  },
  // rubber stamp
  stamp: (t) => {
    tone(t, 90, "sine", 0.5, 0.25, 0.5);
    noise(t, 0.12, "lowpass", 1400, 0.7, 0.3, 0.1);
  },
  // soft confirmation chord
  chime: (t) => {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(t + i * 0.06, f, "sine", 0.08, 0.6, 1));
  },
};

let last = {};
export function sound(name, x) {
  const c = ensure();
  if (!c || !VOICES[name]) return;
  const now = c.currentTime;
  if (last[name] && now - last[name] < 0.03) return; // throttle rapid repeats
  last[name] = now;
  VOICES[name](now, x);
}

export function haptic(ms = 6) {
  if (navigator.vibrate && window.matchMedia("(pointer: coarse)").matches) navigator.vibrate(ms);
}
