const ONBOARDING_KEY = "wilder-onboarding-v1";
const CAMERA_KEY = "wilder-camera-permission";
const LOCATION_KEY = "wilder-location";

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

export function loadStoredLocation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredLocation(location) {
  if (!location || location.latitude == null || location.longitude == null) return;
  localStorage.setItem(
    LOCATION_KEY,
    JSON.stringify({
      latitude: location.latitude,
      longitude: location.longitude,
      placeName: location.placeName || null,
      savedAt: Date.now(),
    })
  );
}

export function toLocationPayload(stored) {
  if (!stored) return null;
  return {
    latitude: stored.latitude,
    longitude: stored.longitude,
    placeName: stored.placeName || null,
  };
}

async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.placeName || null;
  } catch {
    return null;
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

export async function requestLocationPermission() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, error: "unsupported" };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          placeName: null,
        };
        location.placeName = await reverseGeocode(location.latitude, location.longitude);
        saveStoredLocation(location);
        resolve({ ok: true, location: toLocationPayload(location) });
      },
      () => resolve({ ok: false, error: "denied" }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export async function requestAllPermissions() {
  const [camera, location] = await Promise.all([
    requestCameraPermission(),
    requestLocationPermission(),
  ]);
  completeOnboarding();
  return { camera, location };
}

function refreshLocationInBackground() {
  requestLocationPermission().catch(() => {});
}

export function startLocationWatch(onUpdate, onError) {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    },
    onError,
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export async function getCurrentLocation(options = {}) {
  const { refresh = false, maxAge = 30 * 60 * 1000 } = options;
  const cached = loadStoredLocation();

  if (cached && !refresh) {
    const age = Date.now() - (cached.savedAt || 0);
    if (age < maxAge) {
      refreshLocationInBackground();
      return toLocationPayload(cached);
    }
  }

  const result = await requestLocationPermission();
  if (result.ok) return result.location;
  return toLocationPayload(cached);
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
