const DUO_KEY = "wilder-duo-mode";

export function loadDuoState() {
  if (typeof window === "undefined") return { enabled: false, role: null, partnerName: "" };
  try {
    const raw = localStorage.getItem(DUO_KEY);
    return raw
      ? JSON.parse(raw)
      : { enabled: false, role: null, partnerName: "" };
  } catch {
    return { enabled: false, role: null, partnerName: "" };
  }
}

export function saveDuoState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DUO_KEY, JSON.stringify(state));
}

export function generateDuoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function enableDuoMode({ role, partnerName, code }) {
  const state = {
    enabled: true,
    role,
    partnerName: partnerName || "",
    code: code || generateDuoCode(),
    enabledAt: new Date().toISOString(),
  };
  saveDuoState(state);
  return state;
}

export function disableDuoMode() {
  saveDuoState({ enabled: false, role: null, partnerName: "" });
}

export function recordDuoDiscovery(discoveryId) {
  const state = loadDuoState();
  if (!state.enabled) return state;
  const pending = Array.isArray(state.pendingValidations) ? state.pendingValidations : [];
  if (state.role === "child" && !pending.includes(discoveryId)) {
    state.pendingValidations = [...pending, discoveryId];
    saveDuoState(state);
  }
  return state;
}

export function validateDuoDiscovery(discoveryId) {
  const state = loadDuoState();
  if (!state.enabled || state.role !== "parent") return state;
  const validated = Array.isArray(state.validatedIds) ? state.validatedIds : [];
  if (!validated.includes(discoveryId)) {
    state.validatedIds = [...validated, discoveryId];
    state.pendingValidations = (state.pendingValidations || []).filter((id) => id !== discoveryId);
    saveDuoState(state);
  }
  return state;
}
