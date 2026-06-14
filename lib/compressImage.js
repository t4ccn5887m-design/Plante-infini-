/**
 * Reduces data-URL size before localStorage (avoids QuotaExceededError).
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
