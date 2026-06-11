const PROFILE_KEY = "wilder-premium-profile";

export function loadPremiumProfile() {
  if (typeof window === "undefined") {
    return { displayName: "", phone: "", address: "" };
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      displayName: data.displayName || "",
      phone: data.phone || "",
      address: data.address || "",
    };
  } catch {
    return { displayName: "", phone: "", address: "" };
  }
}

export function savePremiumProfile(profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      displayName: profile.displayName?.trim() || "",
      phone: profile.phone?.trim() || "",
      address: profile.address?.trim() || "",
    })
  );
}
