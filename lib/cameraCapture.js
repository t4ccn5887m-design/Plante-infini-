export const VIEWFINDER_ASPECT = 4 / 3;

/**
 * Capture the video region visible inside the on-screen viewfinder frame.
 * Maps object-fit: cover layout + optional CSS zoom to intrinsic video pixels.
 */
export function captureViewfinderFrame(video, viewfinderEl, cssZoom = 1) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const zoom = Math.max(1, cssZoom);
  const elW = video.clientWidth;
  const elH = video.clientHeight;
  if (!elW || !elH) return null;

  const videoAR = vw / vh;
  const elAR = elW / elH;

  let coverW;
  let coverH;
  let coverOx;
  let coverOy;
  if (videoAR > elAR) {
    coverH = elH;
    coverW = elH * videoAR;
    coverOx = (elW - coverW) / 2;
    coverOy = 0;
  } else {
    coverW = elW;
    coverH = elW / videoAR;
    coverOx = 0;
    coverOy = (elH - coverH) / 2;
  }

  const visW = coverW / zoom;
  const visH = coverH / zoom;
  const visOx = coverOx + (coverW - visW) / 2;
  const visOy = coverOy + (coverH - visH) / 2;

  const videoRect = video.getBoundingClientRect();
  const centerX = videoRect.left + videoRect.width / 2;
  const centerY = videoRect.top + videoRect.height / 2;

  const toLayout = (sx, sy) => ({
    x: elW / 2 + (sx - centerX) / zoom,
    y: elH / 2 + (sy - centerY) / zoom,
  });

  let cropScreen;
  if (viewfinderEl) {
    cropScreen = viewfinderEl.getBoundingClientRect();
  } else {
    const cropH = Math.min(elH, elW / VIEWFINDER_ASPECT);
    const cropW = cropH * VIEWFINDER_ASPECT;
    cropScreen = {
      left: centerX - (cropW * zoom) / 2,
      top: centerY - (cropH * zoom) / 2,
      right: centerX + (cropW * zoom) / 2,
      bottom: centerY + (cropH * zoom) / 2,
    };
  }

  const tl = toLayout(cropScreen.left, cropScreen.top);
  const br = toLayout(cropScreen.right, cropScreen.bottom);

  let sx = ((tl.x - visOx) / visW) * vw;
  let sy = ((tl.y - visOy) / visH) * vh;
  let sw = ((br.x - tl.x) / visW) * vw;
  let sh = ((br.y - tl.y) / visH) * vh;

  sx = Math.max(0, Math.min(vw - 1, sx));
  sy = Math.max(0, Math.min(vh - 1, sy));
  sw = Math.max(1, Math.min(vw - sx, sw));
  sh = Math.max(1, Math.min(vh - sy, sh));

  const canvasW = Math.max(1, Math.round(sw));
  const canvasH = Math.max(1, Math.round(sh));
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
  return canvas.toDataURL("image/jpeg", 0.85);
}
