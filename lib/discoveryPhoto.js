/** URL affichable pour la photo d'une trouvaille (local, cloud ou chemin public). */
export function isValidDiscoveryPhoto(src) {
  if (src == null || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;

  if (s.startsWith("data:image/")) {
    const payload = s.split(",")[1];
    return Boolean(payload && payload.length > 32);
  }

  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/") ||
    s.startsWith("blob:")
  ) {
    return true;
  }

  return false;
}

function discoveryPhotoCandidates(discovery) {
  if (!discovery) return [];
  return [
    discovery.photo,
    discovery.cloudImageUrl,
    discovery.image_url,
  ];
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

export function getDiscoveryPhotoUrl(discovery) {
  return pickValidDiscoveryPhoto(discoveryPhotoCandidates(discovery));
}
