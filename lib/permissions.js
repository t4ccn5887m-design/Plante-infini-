const CAMERA_CONSTRAINTS = [
  {
    facingMode: { ideal: "environment" },
    width: { ideal: 4032 },
    height: { ideal: 3024 },
    aspectRatio: { ideal: 4 / 3 },
  },
  {
    facingMode: { ideal: "environment" },
    width: { ideal: 3840 },
    height: { ideal: 2160 },
  },
  {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  { facingMode: { ideal: "environment" } },
  { facingMode: "environment" },
  true,
];

let onboardingComplete = false;
let cameraGranted = false;

export function isOnboardingComplete() {
  return onboardingComplete;
}

export function completeOnboarding() {
  onboardingComplete = true;
}

export function isCameraGranted() {
  return cameraGranted;
}

function setCameraGranted(granted) {
  cameraGranted = granted;
}

/** Sync camera status with the browser Permissions API (no prompt). */
export async function syncCameraPermissionStatus() {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
  try {
    const status = await navigator.permissions.query({ name: "camera" });
    if (status.state === "granted") setCameraGranted(true);
    else if (status.state === "denied") setCameraGranted(false);
    status.onchange = () => {
      if (status.state === "granted") setCameraGranted(true);
      else if (status.state === "denied") setCameraGranted(false);
    };
  } catch {
    /* camera permission name unsupported (e.g. some Safari versions) */
  }
}

export async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraGranted(false);
    return { ok: false, error: "unsupported" };
  }

  for (const video of CAMERA_CONSTRAINTS) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      setCameraGranted(true);
      return { ok: true };
    } catch {
      /* try next constraint */
    }
  }

  setCameraGranted(false);
  return { ok: false, error: "denied" };
}

export async function requestAllPermissions() {
  const camera = isCameraGranted() ? { ok: true } : await requestCameraPermission();
  completeOnboarding();
  return { camera };
}

export async function acquireCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: "unsupported", stream: null };
  }

  await syncCameraPermissionStatus();

  for (const video of CAMERA_CONSTRAINTS) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      setCameraGranted(true);
      return { ok: true, stream };
    } catch {
      /* try next constraint */
    }
  }

  setCameraGranted(false);
  return { ok: false, error: "denied", stream: null };
}
