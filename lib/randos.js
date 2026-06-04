/** Haversine distance in km between two WGS84 points. */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Trail length from consecutive discovery GPS points (chronological order).
 * Returns null if fewer than two geotagged points.
 */
export function computeRandoDistanceKm(album, discoveries) {
  const byId = new Map(discoveries.map((d) => [d.id, d]));
  const points = (album.discoveryIds || [])
    .map((id) => byId.get(id))
    .filter((d) => d?.latitude != null && d?.longitude != null)
    .sort((a, b) => new Date(a.discoveredAt) - new Date(b.discoveredAt));

  if (points.length < 2) return null;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceKm(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return Math.round(total * 10) / 10;
}
