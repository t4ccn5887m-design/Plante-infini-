export async function fetchNurseriesNearby(latitude, longitude) {
  const res = await fetch(
    `/api/nurseries-nearby?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "nurseries_fetch_failed");
  }
  return Array.isArray(data.nurseries) ? data.nurseries : [];
}
