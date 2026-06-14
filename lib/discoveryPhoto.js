/** URL affichable pour la photo d'une trouvaille (local, cloud ou chemin public). */
const MIN_DATA_URL_PAYLOAD = 120;

export function isValidDiscoveryPhoto(src) {
  if (src == null || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;

  if (s.startsWith("data:image/")) {
    const payload = s.split(",")[1];
    return Boolean(payload && payload.length >= MIN_DATA_URL_PAYLOAD);
  }

  if (s.startsWith("blob:")) return false;

  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/")
  ) {
    return true;
  }

  return false;
}

function discoveryPhotoCandidates(discovery) {
  if (!discovery) return [];
  const photo = discovery.photo;
  const cloud = discovery.cloudImageUrl || discovery.image_url;

  if (photo?.trim().startsWith("data:image")) {
    return [photo, cloud];
  }

  return [cloud, photo];
}

/** Première URL photo valide parmi plusieurs sources (local + cloud). */
export function pickValidDiscoveryPhoto(...sources) {
  for (const source of sources) {
    if (Array.isArray(source)) {
      const nested = pickValidDiscoveryPhoto(...source);
      if (nested) return nested;
      continue;
    }
    if (isValidDiscoveryPhoto(source)) return String(source).trim();
  }
  return null;
}

/** Photo affichable — priorise le cloud, garde le data URL local si c'est la seule source valide. */
export function resolveDiscoveryPhoto(discovery) {
  return pickValidDiscoveryPhoto(discoveryPhotoCandidates(discovery));
}

export function getDiscoveryPhotoUrl(discovery) {
  return resolveDiscoveryPhoto(discovery);
}
