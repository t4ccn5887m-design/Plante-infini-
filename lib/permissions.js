const ONBOARDING_KEY = "wilder-onboarding-v1";
const CAMERA_KEY = "wilder-camera-permission";

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

export function isOnboardingComplete() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export function getCameraPermissionStatus() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CAMERA_KEY);
}

export function setCameraPermissionStatus(status) {
  localStorage.setItem(CAMERA_KEY, status);
}

export function isCameraGranted() {
  return getCameraPermissionStatus() === "granted";
}

/** Sync stored camera status with the browser Permissions API (no prompt). */
export async function syncCameraPermissionStatus() {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
  try {
    const status = await navigator.permissions.query({ name: "camera" });
    if (status.state === "granted") setCameraPermissionStatus("granted");
    else if (status.state === "denied") setCameraPermissionStatus("denied");
    status.onchange = () => {
      if (status.state === "granted") setCameraPermissionStatus("granted");
      else if (status.state === "denied") setCameraPermissionStatus("denied");
    };
  } catch {
    /* camera permission name unsupported (e.g. some Safari versions) */
  }
}

export async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraPermissionStatus("denied");
    return { ok: false, error: "unsupported" };
  }

  for (const video of CAMERA_CONSTRAINTS) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermissionStatus("granted");
      return { ok: true };
    } catch {
      /* try next constraint */
    }
  }

  setCameraPermissionStatus("denied");
  return { ok: false, error: "denied" };
}

export async function requestAllPermissions() {
  const camera = isCameraGranted()
    ? { ok: true }
    : await requestCameraPermission();
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
      setCameraPermissionStatus("granted");
      return { ok: true, stream };
    } catch {
      /* try next constraint */
    }
  }

  setCameraPermissionStatus("denied");
  return { ok: false, error: "denied", stream: null };
}
