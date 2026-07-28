#!/usr/bin/env node
// Synthesizes short, original chiptune-style sound effects for Beast Forge as
// mono 16-bit PCM WAV files. No external samples or dependencies are used —
// everything here is generated from basic oscillators and noise.
//
// Run with: node scripts/generate-sfx.js
// Regenerate/tweak by editing the `sounds` definitions at the bottom.

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sfx');

function alloc(durationSec) {
  return new Float32Array(Math.ceil(durationSec * SAMPLE_RATE));
}

// Attack-decay-sustain-release envelope, all times in seconds, sustain is a 0..1 level.
function adsrGain(t, duration, { attack = 0.005, decay = 0.05, sustain = 0.7, release = 0.05 } = {}) {
  if (t < 0 || t > duration) return 0;
  if (t < attack) return attack > 0 ? t / attack : 1;
  const releaseStart = Math.max(duration - release, attack);
  if (t < attack + decay && t < releaseStart) {
    const decayT = decay > 0 ? (t - attack) / decay : 1;
    return 1 - (1 - sustain) * Math.min(decayT, 1);
  }
  if (t < releaseStart) return sustain;
  const releaseT = duration - releaseStart > 0 ? (t - releaseStart) / (duration - releaseStart) : 1;
  return sustain * (1 - Math.min(releaseT, 1));
}

const WAVES = {
  sine: (phase) => Math.sin(phase),
  triangle: (phase) => {
    const p = ((phase / (2 * Math.PI)) % 1 + 1) % 1;
    return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
  },
  square: (phase) => (Math.sin(phase) >= 0 ? 1 : -1),
};

// Adds a tone (optionally sweeping from freqStart to freqEnd) into buf starting at startSec.
function addTone(buf, startSec, durationSec, freqStart, freqEnd, wave, envelope, volume) {
  const waveFn = WAVES[wave];
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const count = Math.floor(durationSec * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < count; i++) {
    const idx = startSample + i;
    if (idx >= buf.length) break;
    const t = i / SAMPLE_RATE;
    const freq = freqStart + (freqEnd - freqStart) * (durationSec > 0 ? t / durationSec : 0);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const gain = adsrGain(t, durationSec, envelope) * volume;
    buf[idx] += waveFn(phase) * gain;
  }
}

// Adds filtered noise (a soft one-pole low-pass keeps it from sounding harsh/hissy).
function addNoise(buf, startSec, durationSec, envelope, volume, cutoff = 0.35) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const count = Math.floor(durationSec * SAMPLE_RATE);
  let prev = 0;
  for (let i = 0; i < count; i++) {
    const idx = startSample + i;
    if (idx >= buf.length) break;
    const t = i / SAMPLE_RATE;
    const raw = Math.random() * 2 - 1;
    prev = prev + cutoff * (raw - prev);
    const gain = adsrGain(t, durationSec, envelope) * volume;
    buf[idx] += prev * gain;
  }
}

function normalize(buf, peak = 0.9) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max <= 0) return;
  const scale = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= scale;
}

function writeWav(filePath, buf) {
  const dataSize = buf.length * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const data = Buffer.alloc(dataSize);
  for (let i = 0; i < buf.length; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
}

// --- Sound definitions -----------------------------------------------------
// Each builder returns a Float32Array buffer ready to normalize + write.

function buildTap() {
  const buf = alloc(0.09);
  addTone(buf, 0, 0.06, 1400, 1200, 'triangle', { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.02 }, 0.5);
  return buf;
}

function buildFeed() {
  const buf = alloc(0.3);
  addNoise(buf, 0, 0.06, { attack: 0.002, decay: 0.03, sustain: 0.2, release: 0.02 }, 0.35, 0.5);
  addTone(buf, 0.01, 0.09, 220, 170, 'triangle', { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.03 }, 0.5);
  addNoise(buf, 0.13, 0.05, { attack: 0.002, decay: 0.02, sustain: 0.2, release: 0.02 }, 0.3, 0.5);
  addTone(buf, 0.14, 0.08, 190, 150, 'triangle', { attack: 0.005, decay: 0.04, sustain: 0.3, release: 0.03 }, 0.45);
  return buf;
}

function buildTrain() {
  const buf = alloc(0.35);
  addNoise(buf, 0, 0.12, { attack: 0.01, decay: 0.05, sustain: 0.4, release: 0.06 }, 0.3, 0.6);
  addTone(buf, 0.02, 0.22, 140, 90, 'square', { attack: 0.01, decay: 0.08, sustain: 0.5, release: 0.12 }, 0.4);
  return buf;
}

function buildBreed() {
  const buf = alloc(0.55);
  addTone(buf, 0, 0.24, 523.25, 523.25, 'sine', { attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.12 }, 0.35);
  addTone(buf, 0.12, 0.4, 659.25, 659.25, 'sine', { attack: 0.01, decay: 0.08, sustain: 0.6, release: 0.28 }, 0.4);
  addTone(buf, 0.12, 0.4, 987.77, 987.77, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.28 }, 0.18);
  return buf;
}

function buildHatch() {
  const buf = alloc(0.7);
  addNoise(buf, 0, 0.05, { attack: 0.001, decay: 0.02, sustain: 0.3, release: 0.02 }, 0.5, 0.7);
  addNoise(buf, 0.06, 0.04, { attack: 0.001, decay: 0.02, sustain: 0.3, release: 0.02 }, 0.4, 0.7);
  const notes = [784, 987.77, 1174.66, 1567.98];
  notes.forEach((freq, i) => {
    addTone(
      buf,
      0.12 + i * 0.07,
      0.35 - i * 0.05,
      freq,
      freq,
      'sine',
      { attack: 0.005, decay: 0.08, sustain: 0.5, release: 0.2 },
      0.32
    );
  });
  return buf;
}

function buildEvolve() {
  const buf = alloc(1.3);
  addTone(buf, 0, 0.9, 110, 440, 'sine', { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 }, 0.4);
  addTone(buf, 0, 0.9, 110, 440, 'triangle', { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.5 }, 0.25);
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((freq) => {
    addTone(buf, 0.75, 0.5, freq, freq, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.35 }, 0.22);
  });
  return buf;
}

function buildGachaReveal() {
  const buf = alloc(0.4);
  addTone(buf, 0, 0.32, 1046.5, 1046.5, 'sine', { attack: 0.005, decay: 0.08, sustain: 0.5, release: 0.22 }, 0.4);
  addTone(buf, 0, 0.32, 1318.5, 1318.5, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.35, release: 0.22 }, 0.2);
  return buf;
}

function buildGachaRare() {
  const buf = alloc(0.85);
  const notes = [659.25, 783.99, 987.77, 1318.5, 1567.98];
  notes.forEach((freq, i) => {
    addTone(
      buf,
      i * 0.09,
      0.4 - i * 0.03,
      freq,
      freq,
      'sine',
      { attack: 0.004, decay: 0.06, sustain: 0.55, release: 0.28 },
      0.3
    );
    addTone(
      buf,
      i * 0.09,
      0.35 - i * 0.03,
      freq * 2,
      freq * 2,
      'triangle',
      { attack: 0.004, decay: 0.05, sustain: 0.3, release: 0.2 },
      0.12
    );
  });
  return buf;
}

function buildDungeonFound() {
  const buf = alloc(0.4);
  addTone(buf, 0, 0.18, 784, 784, 'sine', { attack: 0.005, decay: 0.05, sustain: 0.55, release: 0.1 }, 0.35);
  addTone(buf, 0.13, 0.25, 987.77, 987.77, 'sine', { attack: 0.005, decay: 0.06, sustain: 0.5, release: 0.18 }, 0.38);
  return buf;
}

function buildDungeonEmpty() {
  const buf = alloc(0.35);
  addTone(buf, 0, 0.32, 440, 349.23, 'triangle', { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 }, 0.3);
  return buf;
}

function buildBattleResult() {
  const buf = alloc(0.95);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    addTone(
      buf,
      i * 0.11,
      0.3,
      freq,
      freq,
      'square',
      { attack: 0.005, decay: 0.06, sustain: 0.45, release: 0.16 },
      0.22
    );
    addTone(buf, i * 0.11, 0.3, freq, freq, 'sine', { attack: 0.005, decay: 0.08, sustain: 0.5, release: 0.2 }, 0.25);
  });
  addTone(buf, 0.44, 0.5, 1046.5, 1046.5, 'sine', { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.4 }, 0.3);
  addTone(buf, 0.44, 0.5, 1318.5, 1318.5, 'sine', { attack: 0.01, decay: 0.12, sustain: 0.45, release: 0.4 }, 0.2);
  return buf;
}

const sounds = {
  tap: buildTap,
  feed: buildFeed,
  train: buildTrain,
  breed: buildBreed,
  hatch: buildHatch,
  evolve: buildEvolve,
  gacha_reveal: buildGachaReveal,
  gacha_rare: buildGachaRare,
  dungeon_found: buildDungeonFound,
  dungeon_empty: buildDungeonEmpty,
  battle_result: buildBattleResult,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, build] of Object.entries(sounds)) {
  const buf = build();
  normalize(buf);
  const filePath = path.join(OUT_DIR, `${name}.wav`);
  writeWav(filePath, buf);
  console.log(`wrote ${filePath}`);
}
