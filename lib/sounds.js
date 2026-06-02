const DISCOVERY_SOUND = "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3";

const TYPE_SOUNDS = {
  oiseau: "https://assets.mixkit.co/active_storage/sfx/2431/2431-preview.mp3",
  animal: "https://assets.mixkit.co/active_storage/sfx/2475/2475-preview.mp3",
  insecte: "https://assets.mixkit.co/active_storage/sfx/2433/2433-preview.mp3",
  papillon: "https://assets.mixkit.co/active_storage/sfx/2433/2433-preview.mp3",
  reptile: "https://assets.mixkit.co/active_storage/sfx/2475/2475-preview.mp3",
  plante: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  fleur: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  arbre: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  champignon: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  fruit: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  legume: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
};

let audioCtx = null;

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

function playUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 0.55;
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });
}

export async function playDiscoverySound() {
  const ok = await playUrl(DISCOVERY_SOUND);
  if (!ok) playSynthDiscovery();
}

export async function playTypeSound(type) {
  const url = TYPE_SOUNDS[type] || TYPE_SOUNDS.plante;
  const ok = await playUrl(url);
  if (!ok) playSynthDiscovery();
}
