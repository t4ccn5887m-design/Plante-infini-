const DISCOVERY_SOUND = "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3";

let audioCtx = null;
let currentAudio = null;

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
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.4);
  });
}

export function stopCurrentSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function playUrl(url) {
  return new Promise((resolve) => {
    stopCurrentSound();
    const audio = new Audio(url);
    currentAudio = audio;
    audio.volume = 0.65;
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve(true);
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve(false);
    };
    audio.play().catch(() => resolve(false));
  });
}

export async function playDiscoverySound() {
  const ok = await playUrl(DISCOVERY_SOUND);
  if (!ok) playSynthDiscovery();
}
