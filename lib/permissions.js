const ONBOARDING_KEY = "wilder-onboarding-v1";
const CAMERA_KEY = "wilder-camera-permission";

const CAMERA_CONSTRAINTS = [
  { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
  const camera = await requestCameraPermission();
  if (camera.ok) {
    completeOnboarding();
  }
  return { camera };
}

export async function acquireCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: "unsupported", stream: null };
  }

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
