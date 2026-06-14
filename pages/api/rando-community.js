import { resolveAuthUser } from "@/lib/apiAuth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

const DEFAULT_RADIUS_KM = 80;
const MAX_JOURNAL_AGE_DAYS = 60;

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

function rowToSummary(row) {
  return {
    id: row.id,
    localAlbumId: row.local_album_id || null,
    authorName: row.author_name || "Randonneur·euse",
    name: row.name,
    placeName: row.place_name || null,
    distanceKm: row.distance_km ?? null,
    discoveryCount: row.discovery_count ?? 0,
    coverPhoto: row.cover_photo || null,
    latitude: row.latitude,
    longitude: row.longitude,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

function rowToDetail(row, comments, likeCounts, likedByMe) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    ...rowToSummary(row),
    payload: {
      gpsTrack: Array.isArray(payload.gpsTrack) ? payload.gpsTrack : [],
      discoveries: Array.isArray(payload.discoveries) ? payload.discoveries : [],
    },
    comments: comments || [],
    likeCounts: likeCounts || {},
    likedByMe: likedByMe || {},
  };
}

async function loadLikeMeta(journalId, voterId) {
  const { data, error } = await supabase
    .from("rando_community_discovery_likes")
    .select("discovery_key, voter_id")
    .eq("journal_id", journalId);

  if (error) throw error;

  const likeCounts = {};
  const likedByMe = {};
  for (const row of data || []) {
    likeCounts[row.discovery_key] = (likeCounts[row.discovery_key] || 0) + 1;
    if (voterId && row.voter_id === voterId) likedByMe[row.discovery_key] = true;
  }
  return { likeCounts, likedByMe };
}

async function getJournalDetail(journalId, voterId) {
  const { data: row, error } = await supabase
    .from("rando_community_journals")
    .select(
      "id, local_album_id, author_name, name, place_name, distance_km, discovery_count, cover_photo, latitude, longitude, ended_at, payload, created_at"
    )
    .eq("id", journalId)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const { data: comments, error: cErr } = await supabase
    .from("rando_community_comments")
    .select("id, author_name, body, created_at")
    .eq("journal_id", journalId)
    .order("created_at", { ascending: true })
    .limit(80);

  if (cErr) throw cErr;

  const { likeCounts, likedByMe } = await loadLikeMeta(journalId, voterId);

  return rowToDetail(
    row,
    (comments || []).map((c) => ({
      id: c.id,
      authorName: c.author_name,
      body: c.body,
      createdAt: c.created_at,
    })),
    likeCounts,
    likedByMe
  );
}

export default async function handler(req, res) {
  if (!supabase) {
    if (req.method === "GET") return res.status(200).json({ journals: [], offline: true });
    return res.status(503).json({ erreur: "Communauté non disponible" });
  }

  if (req.method === "GET") {
    const journalId = req.query.journalId;
    const authUser = await resolveAuthUser(req);
    const voterId = authUser?.id || String(req.query.voterId || "").slice(0, 64);

    if (journalId) {
      try {
        const journal = await getJournalDetail(String(journalId), voterId);
        if (!journal) return res.status(404).json({ erreur: "Carnet introuvable" });
        return res.status(200).json({ journal });
      } catch (err) {
        console.error("[Wilder] rando-community detail:", err.message);
        return res.status(500).json({ erreur: err.message });
      }
    }

    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radiusKm = Math.min(120, Math.max(10, parseFloat(req.query.radiusKm) || DEFAULT_RADIUS_KM));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ erreur: "Coordonnées invalides" });
    }

    const since = new Date(Date.now() - MAX_JOURNAL_AGE_DAYS * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from("rando_community_journals")
      .select(
        "id, local_album_id, author_name, name, place_name, distance_km, discovery_count, cover_photo, latitude, longitude, ended_at, created_at"
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Wilder] rando-community GET:", error.message);
      return res.status(500).json({ erreur: error.message });
    }

    const journals = (data || [])
      .map(rowToSummary)
      .filter((j) => distanceKm(lat, lon, j.latitude, j.longitude) <= radiusKm)
      .slice(0, 40);

    return res.status(200).json({ journals });
  }

  if (req.method === "POST") {
    if (!supabaseAdmin) {
      return res.status(503).json({ erreur: "Communauté non disponible" });
    }

    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ erreur: "auth_required" });
    }

    const { action } = req.body || {};

    if (action === "share") {
      const { journal, authorName } = req.body;
      if (!journal?.name || !journal?.payload) {
        return res.status(400).json({ erreur: "Carnet invalide" });
      }
      const lat = parseFloat(journal.latitude);
      const lon = parseFloat(journal.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ erreur: "Localisation requise" });
      }

      const discoveries = journal.payload?.discoveries || [];
      const payload = {
        gpsTrack: Array.isArray(journal.payload.gpsTrack) ? journal.payload.gpsTrack : [],
        discoveries: Array.isArray(discoveries) ? discoveries.slice(0, 40) : [],
      };

      const row = {
        local_album_id: journal.localAlbumId ? String(journal.localAlbumId).slice(0, 80) : null,
        author_name: String(authorName || "Randonneur·euse").slice(0, 40),
        name: String(journal.name).slice(0, 120),
        place_name: journal.placeName ? String(journal.placeName).slice(0, 120) : null,
        distance_km: Number.isFinite(journal.distanceKm) ? journal.distanceKm : null,
        discovery_count: payload.discoveries.length,
        cover_photo: journal.coverPhoto ? String(journal.coverPhoto).slice(0, 500_000) : null,
        latitude: lat,
        longitude: lon,
        ended_at: journal.endedAt || new Date().toISOString(),
        payload,
        author_id: user.id,
      };

      const { data, error } = await supabaseAdmin
        .from("rando_community_journals")
        .insert(row)
        .select(
          "id, local_album_id, author_name, name, place_name, distance_km, discovery_count, cover_photo, latitude, longitude, ended_at, created_at"
        )
        .single();

      if (error) {
        console.error("[Wilder] rando-community share:", error.message);
        return res.status(500).json({ erreur: error.message });
      }

      return res.status(200).json({
        journal: {
          ...rowToSummary(data),
          payload,
          comments: [],
          likeCounts: {},
          likedByMe: {},
        },
      });
    }

    if (action === "comment") {
      const { journalId, authorName, body } = req.body;
      const text = String(body || "").trim().slice(0, 500);
      if (!journalId || !text) {
        return res.status(400).json({ erreur: "Commentaire invalide" });
      }

      const { data, error } = await supabaseAdmin
        .from("rando_community_comments")
        .insert({
          journal_id: journalId,
          author_name: String(authorName || "Randonneur·euse").slice(0, 40),
          body: text,
          author_id: user.id,
        })
        .select("id, author_name, body, created_at")
        .single();

      if (error) {
        console.error("[Wilder] rando-community comment:", error.message);
        return res.status(500).json({ erreur: error.message });
      }

      return res.status(200).json({
        comment: {
          id: data.id,
          authorName: data.author_name,
          body: data.body,
          createdAt: data.created_at,
        },
      });
    }

    if (action === "like") {
      const { journalId, discoveryKey } = req.body;
      const key = String(discoveryKey || "").slice(0, 80);
      const voter = user.id;
      if (!journalId || !key) {
        return res.status(400).json({ erreur: "Like invalide" });
      }

      const { data: existing } = await supabaseAdmin
        .from("rando_community_discovery_likes")
        .select("id")
        .eq("journal_id", journalId)
        .eq("discovery_key", key)
        .eq("voter_id", voter)
        .maybeSingle();

      if (existing?.id) {
        await supabaseAdmin.from("rando_community_discovery_likes").delete().eq("id", existing.id);
      } else {
        await supabaseAdmin.from("rando_community_discovery_likes").insert({
          journal_id: journalId,
          discovery_key: key,
          voter_id: voter,
        });
      }

      const { likeCounts, likedByMe } = await loadLikeMeta(journalId, voter);
      return res.status(200).json({ likeCounts, likedByMe });
    }

    return res.status(400).json({ erreur: "Action inconnue" });
  }

  return res.status(405).end();
}
