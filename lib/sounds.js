/**
 * Nature SFX from freesound.org (bundled in /public/sounds).
 * - discovery.mp3 — LeavesRustling01 by falcospizaetus (CC0), id 489925
 * - badge-unlock.mp3 — Wooden Wind Chime in Breeze by Soup_UnderScore (CC0), id 708025
 */

const DISCOVERY_SOUND = "/sounds/discovery.mp3";
const BADGE_UNLOCK_SOUND = "/sounds/badge-unlock.mp3";

const BADGE_MAX_SECONDS = 2;

let audioCtx = null;
let currentAudio = null;
let stopTimer = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

function playSynthDiscovery() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.6;
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + 0.15);
}

function playSynthBadge() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(784, now);
  osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.8);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.7);
}

export function stopCurrentSound() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function playUrl(url, { volume = 0.65, maxDuration } = {}) {
  return new Promise((resolve) => {
    stopCurrentSound();
    const audio = new Audio(url);
    currentAudio = audio;
    audio.volume = volume;

    const finish = (ok) => {
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
      if (currentAudio === audio) currentAudio = null;
      resolve(ok);
    };

    if (maxDuration) {
      stopTimer = setTimeout(() => {
        audio.pause();
        finish(true);
      }, maxDuration * 1000);
    }

    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
  });
}

export async function playDiscoverySound() {
  const ok = await playUrl(DISCOVERY_SOUND, { volume: 0.5 });
  if (!ok) playSynthDiscovery();
}

export async function playBadgeUnlockSound() {
  const ok = await playUrl(BADGE_UNLOCK_SOUND, {
    volume: 0.55,
    maxDuration: BADGE_MAX_SECONDS,
  });
  if (!ok) playSynthBadge();
}
