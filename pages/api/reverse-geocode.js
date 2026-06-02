export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ erreur: "Coordonnées manquantes" });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "fr");
    url.searchParams.set("zoom", "14");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Wilder/1.0 (nature-discovery-app)" },
    });

    if (!response.ok) {
      return res.status(502).json({ erreur: "Géocodage indisponible" });
    }

    const data = await response.json();
    const addr = data.address || {};
    const parts = [
      addr.village || addr.town || addr.city || addr.hamlet,
      addr.municipality || addr.county,
      addr.country,
    ].filter(Boolean);

    res.status(200).json({
      placeName: parts.slice(0, 2).join(", ") || data.display_name?.split(",").slice(0, 2).join(", ") || null,
    });
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
}
