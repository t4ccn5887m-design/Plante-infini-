import { supabase } from "@/lib/supabase";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const DEFAULT_RADIUS_KM = 25;
const MAX_POST_AGE_DAYS = 14;

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function rowToPost(row) {
  return {
    id: row.id,
    kind: row.kind,
    comment: row.comment || "",
    photo: row.photo || null,
    plants: Array.isArray(row.plants) ? row.plants : [],
    latitude: row.latitude,
    longitude: row.longitude,
    placeName: row.place_name || null,
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  if (!supabase) {
    if (req.method === "GET") {
      return res.status(200).json({ posts: [], offline: true });
    }
    return res.status(503).json({ erreur: "Communauté non disponible" });
  }

  if (req.method === "GET") {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radiusKm = Math.min(50, Math.max(5, parseFloat(req.query.radiusKm) || DEFAULT_RADIUS_KM));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ erreur: "Coordonnées invalides" });
    }

    const since = new Date(Date.now() - MAX_POST_AGE_DAYS * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from("potager_community_posts")
      .select("id, kind, comment, photo, plants, latitude, longitude, place_name, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) {
      console.error("[Wilder] potager-community GET:", error.message);
      return res.status(500).json({ erreur: error.message });
    }

    const posts = (data || [])
      .map(rowToPost)
      .filter((p) => distanceKm(lat, lon, p.latitude, p.longitude) <= radiusKm)
      .slice(0, 40);

    return res.status(200).json({ posts });
  }

  if (req.method === "POST") {
    const {
      kind,
      comment = "",
      photo = null,
      plants = [],
      latitude,
      longitude,
      placeName = null,
    } = req.body || {};

    if (kind !== "harvest" && kind !== "surplus") {
      return res.status(400).json({ erreur: "Type de publication invalide" });
    }

    if (kind === "harvest" && !photo) {
      return res.status(400).json({ erreur: "Photo requise pour partager une récolte" });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ erreur: "Localisation requise" });
    }

    const plantList = Array.isArray(plants)
      ? plants.map((p) => String(p).trim()).filter(Boolean)
      : [];

    if (kind === "surplus" && plantList.length === 0 && !String(comment).trim()) {
      return res.status(400).json({ erreur: "Indiquez au moins un légume ou un message" });
    }

    const payload = {
      kind,
      comment: String(comment || "").trim().slice(0, 500) || null,
      photo: kind === "harvest" ? String(photo).slice(0, 500_000) : photo ? String(photo).slice(0, 500_000) : null,
      plants: plantList,
      latitude: lat,
      longitude: lon,
      place_name: placeName ? String(placeName).slice(0, 120) : null,
    };

    const { data, error } = await supabase
      .from("potager_community_posts")
      .insert(payload)
      .select("id, kind, comment, photo, plants, latitude, longitude, place_name, created_at")
      .single();

    if (error) {
      console.error("[Wilder] potager-community POST:", error.message);
      return res.status(500).json({ erreur: error.message });
    }

    return res.status(200).json({ post: rowToPost(data) });
  }

  return res.status(405).end();
}
