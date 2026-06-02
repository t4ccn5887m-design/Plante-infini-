function buildXenoQueries(nomLatin, nom) {
  const queries = [];
  if (nomLatin) {
    const parts = nomLatin.trim().split(/\s+/);
    if (parts.length >= 2) {
      queries.push(`gen:${parts[0]} sp:${parts.slice(1).join(" ")}`);
    }
    queries.push(nomLatin.trim());
  }
  if (nom) {
    queries.push(`en:"${nom.trim()}"`);
    queries.push(nom.trim());
  }
  return queries;
}

async function fetchXenoCanto(nomLatin, nom) {
  const key = process.env.XENO_CANTO_API_KEY;
  if (!key) return { error: "xeno_canto_key_missing" };

  for (const query of buildXenoQueries(nomLatin, nom)) {
    const params = new URLSearchParams({
      key,
      query,
      per_page: "15",
    });
    const res = await fetch(`https://xeno-canto.org/api/3/recordings?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) continue;

    const data = await res.json();
    if (data.error) continue;

    const recordings = data.recordings || [];
    if (recordings.length === 0) continue;

    const best =
      recordings.find((r) => r.q === "A") ||
      recordings.find((r) => r.type === "song" || r.type === "call") ||
      recordings[0];

    const file = best.file || "";
    if (!file) continue;

    return {
      url: file.startsWith("//") ? `https:${file}` : file,
      source: "xeno-canto",
      credit: best.rec || null,
    };
  }

  return null;
}

async function fetchFreesound(query) {
  const key = process.env.FREESOUND_API_KEY;
  if (!key) return { error: "freesound_key_missing" };

  const params = new URLSearchParams({
    query,
    filter: "duration:[0.5 TO 30]",
    fields: "id,name,previews,username",
    page_size: "8",
    sort: "rating_desc",
  });

  const res = await fetch(`https://freesound.org/apiv2/search/text/?${params}`, {
    headers: { Authorization: `Token ${key}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const results = data.results || [];
  if (results.length === 0) return null;

  const hit = results[0];
  const preview = hit.previews?.["preview-hq-mp3"] || hit.previews?.["preview-lq-mp3"];
  if (!preview) return null;

  return {
    url: preview,
    source: "freesound",
    credit: hit.username ? `@${hit.username}` : null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { type, nom, nom_latin: nomLatin } = req.query;
  if (!nom && !nomLatin) {
    return res.status(400).json({ erreur: "Nom requis" });
  }

  try {
    let result = null;

    if (type === "oiseau") {
      result = await fetchXenoCanto(nomLatin, nom);
      if (result?.error === "xeno_canto_key_missing") {
        return res.status(503).json({ erreur: "xeno_canto_key_missing" });
      }
    } else {
      const queries = [nomLatin, nom, nom && `${nom} animal sound`].filter(Boolean);
      for (const q of queries) {
        const found = await fetchFreesound(q);
        if (found?.error === "freesound_key_missing") {
          return res.status(503).json({ erreur: "freesound_key_missing" });
        }
        if (found?.url) {
          result = found;
          break;
        }
      }
    }

    if (!result?.url) {
      return res.status(404).json({ erreur: "Son introuvable" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
}
