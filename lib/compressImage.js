/**
 * Reduces data-URL size before localStorage (avoids QuotaExceededError).
 * On decode failure, returns the original dataUrl (legacy callers).
 */
export function compressDataUrl(dataUrl, maxWidth = 480, quality = 0.55) {
  if (typeof window === "undefined" || !dataUrl?.startsWith("data:image")) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        resolve(dataUrl);
        return;
      }

      let { width, height } = img;
      const scale = width > maxWidth ? maxWidth / width : 1;
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        if (!compressed.startsWith("data:image") || compressed.length < 500) {
          resolve(dataUrl);
          return;
        }
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Compress to JPEG for upload. Fails closed on HEIC/undecodable images
 * (does not return the raw HEIC payload).
 * @returns {Promise<{ ok: true, dataUrl: string, blob: Blob } | { ok: false, error: string }>}
 */
export function compressToJpegBlob(dataUrl, maxWidth = 1600, quality = 0.82) {
  if (typeof window === "undefined" || !dataUrl?.startsWith("data:image")) {
    return Promise.resolve({ ok: false, error: "photo_invalid" });
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        resolve({ ok: false, error: "photo_undecodable" });
        return;
      }

      let { width, height } = img;
      const scale = width > maxWidth ? maxWidth / width : 1;
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ ok: false, error: "photo_encode_failed" });
        return;
      }

      try {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        if (!compressed.startsWith("data:image/jpeg") || compressed.length < 500) {
          resolve({ ok: false, error: "photo_encode_failed" });
          return;
        }
        const blob = dataUrlToJpegBlob(compressed);
        if (!blob) {
          resolve({ ok: false, error: "photo_encode_failed" });
          return;
        }
        resolve({ ok: true, dataUrl: compressed, blob });
      } catch {
        resolve({ ok: false, error: "photo_encode_failed" });
      }
    };
    img.onerror = () => resolve({ ok: false, error: "photo_undecodable" });
    img.src = dataUrl;
  });
}

function dataUrlToJpegBlob(dataUrl) {
  const [header, body] = String(dataUrl || "").split(",");
  if (!body) return null;
  const mimeMatch = /data:([^;]+)/.exec(header || "");
  const mime = mimeMatch?.[1] || "image/jpeg";
  if (!mime.includes("jpeg") && !mime.includes("jpg")) return null;
  try {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: "image/jpeg" });
  } catch {
    return null;
  }
}
