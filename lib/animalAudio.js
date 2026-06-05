/** Génère un spectrogramme (data URL JPEG) à partir d'un blob audio pour analyse Claude Vision. */

function energyToColor(energy) {
  const e = Math.min(1, Math.max(0, energy));
  const r = Math.floor(20 + e * 200);
  const g = Math.floor(30 + e * 120);
  const b = Math.floor(80 + e * 175);
  return `rgb(${r},${g},${b})`;
}

function getSeasonHint() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "printemps";
  if (month >= 5 && month <= 7) return "été";
  if (month >= 8 && month <= 10) return "automne";
  return "hiver";
}

export function getAnimalContext() {
  const now = new Date();
  const hour = now.getHours();
  let timeOfDay = "jour";
  if (hour >= 5 && hour < 8) timeOfDay = "aube";
  else if (hour >= 8 && hour < 12) timeOfDay = "matin";
  else if (hour >= 12 && hour < 17) timeOfDay = "après-midi";
  else if (hour >= 17 && hour < 21) timeOfDay = "soir";
  else timeOfDay = "nuit";

  return {
    season: getSeasonHint(),
    timeOfDay,
    recordedAt: now.toISOString(),
  };
}

export async function generateSpectrogram(audioBlob) {
  const audioCtx = new AudioContext();
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const width = 512;
    const height = 256;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, width, height);

    const windowSize = 1024;
    const hop = Math.max(1, Math.floor((data.length - windowSize) / width));

    for (let x = 0; x < width; x++) {
      const offset = x * hop;
      const slice = data.subarray(offset, offset + windowSize);
      const bands = height;

      for (let band = 0; band < bands; band++) {
        const bandStart = Math.floor((band / bands) * (slice.length / 2));
        const bandEnd = Math.floor(((band + 1) / bands) * (slice.length / 2));
        let energy = 0;
        let count = 0;
        for (let i = bandStart; i < bandEnd && i < slice.length; i++) {
          energy += Math.abs(slice[i]);
          count++;
        }
        energy = count ? energy / count : 0;
        const boosted = Math.min(1, energy * 8);
        ctx.fillStyle = energyToColor(boosted);
        ctx.fillRect(x, height - band - 1, 1, 1);
      }
    }

    const durationSec = Math.round((audioBuffer.length / sampleRate) * 10) / 10;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    return { dataUrl, durationSec, base64: dataUrl.split(",")[1] };
  } finally {
    await audioCtx.close();
  }
}

export async function requestMicrophonePermission() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: "unsupported" };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.name || "denied" };
  }
}
