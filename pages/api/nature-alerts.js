import { fetchNearbyNatureContext } from "@/lib/inaturalist";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ erreur: "Coordonnées invalides" });
  }

  try {
    const context = await fetchNearbyNatureContext(lat, lng, { radiusKm: 2, month });
    res.status(200).json(context);
  } catch (error) {
    res.status(502).json({ erreur: error.message || "iNaturalist indisponible" });
  }
}
