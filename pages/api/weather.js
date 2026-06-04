export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ erreur: "Coordonnées manquantes" });
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);
    url.searchParams.set(
      "current",
      "temperature_2m,weather_code,precipitation"
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"
    );
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(502).json({ erreur: "Météo indisponible" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
}
