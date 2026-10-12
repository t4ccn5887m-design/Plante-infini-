const PROFILE_KEY = "wilder-premium-profile";

function splitDisplayName(displayName) {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function normalizeStoredProfile(data = {}) {
  const fromLegacy = splitDisplayName(data.displayName);
  const firstName = (data.firstName || fromLegacy.firstName || "").trim();
  const lastName = (data.lastName || fromLegacy.lastName || "").trim();
  const displayName =
    (data.displayName || "").trim() || [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    displayName,
    firstName,
    lastName,
    phone: data.phone || "",
    city: data.city || data.address || "",
    postalCode: data.postalCode || "",
    address: data.address || data.city || "",
    email: data.email || "",
  };
}

export function loadPremiumProfile() {
  if (typeof window === "undefined") {
    return normalizeStoredProfile({});
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return normalizeStoredProfile(data);
  } catch {
    return normalizeStoredProfile({});
  }
}

export function savePremiumProfile(profile) {
  if (typeof window === "undefined") return;
  const normalized = normalizeStoredProfile(profile);
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      displayName: normalized.displayName,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      phone: normalized.phone,
      city: normalized.city,
      postalCode: normalized.postalCode,
      address: normalized.address,
      email: normalized.email,
    })
  );
}
