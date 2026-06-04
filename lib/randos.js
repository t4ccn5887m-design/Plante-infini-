const MIN_TRACK_STEP_M = 4;

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

/** Distance walked along a GPS track (km), rounded to 0.1 km. */
export function computeTrackDistanceKm(track) {
  if (!Array.isArray(track) || track.length < 2) return null;
  let total = 0;
  for (let i = 1; i < track.length; i++) {
    total += distanceKm(
      track[i - 1].latitude,
      track[i - 1].longitude,
      track[i].latitude,
      track[i].longitude
    );
  }
  return Math.round(total * 10) / 10;
}

/** Append a GPS point if far enough from the last one. */
export function appendTrackPoint(track, point) {
  if (point?.latitude == null || point?.longitude == null) return track;
  const entry = {
    latitude: point.latitude,
    longitude: point.longitude,
    timestamp: point.timestamp || Date.now(),
  };
  if (!Array.isArray(track) || track.length === 0) return [entry];
  const last = track[track.length - 1];
  const stepM = distanceKm(last.latitude, last.longitude, entry.latitude, entry.longitude) * 1000;
  if (stepM < MIN_TRACK_STEP_M) return track;
  return [...track, entry];
}

/**
 * Trail length from GPS track, or consecutive discovery points (chronological order).
 * Returns null if fewer than two geotagged points.
 */
export function computeRandoDistanceKm(album, discoveries) {
  const fromTrack = computeTrackDistanceKm(album?.gpsTrack);
  if (fromTrack != null) return fromTrack;

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
