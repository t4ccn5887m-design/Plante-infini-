import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { isLocalPhotoAdminEnabled } from "@/lib/localPhotoAdmin";

const PHOTO_BG = "#F7F5F0";

export async function getServerSideProps() {
  if (!isLocalPhotoAdminEnabled()) {
    return { notFound: true };
  }
  return { props: {} };
}

function candidateCacheKey(catalogueId, c) {
  if (c.source === "Pixabay" && c.pixabayId != null) {
    return `${catalogueId}:px:${c.pixabayId}`;
  }
  return `${catalogueId}:wm:${c.wikimediaTitle || c.pageUrl}`;
}

function previewUrlForCandidate(c, displayVariant, rembgByKey, cacheKey) {
  if (displayVariant === "white_bg" && rembgByKey[cacheKey]) {
    return rembgByKey[cacheKey].previewUrl;
  }
  return c.thumbnailUrl || c.hdUrl;
}

export default function AdminPlantPhotosPage() {
  const [univers, setUnivers] = useState("vegetal");
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [candidatesById, setCandidatesById] = useState({});
  const [choices, setChoices] = useState({});
  const [index, setIndex] = useState(0);
  const [onlyPending, setOnlyPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [displayVariant, setDisplayVariant] = useState("original");
  const [rembgByKey, setRembgByKey] = useState({});
  const [rembgLoadingKey, setRembgLoadingKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/local/plant-photos?univers=${encodeURIComponent(univers)}`);
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setPlants(data.plants || []);
      setCandidatesById(data.candidates || {});
      setChoices(data.choices || {});
    } catch {
      setError("Impossible de charger les données.");
    }
    setLoading(false);
  }, [univers]);

  useEffect(() => {
    load();
  }, [load]);

  const isValidated = useCallback(
    (id) => {
      const c = choices[id];
      return c?.status === "selected" || c?.status === "none";
    },
    [choices]
  );

  const validatedCount = useMemo(
    () => plants.filter((p) => isValidated(p.id)).length,
    [plants, isValidated]
  );

  const visiblePlants = useMemo(() => {
    if (!onlyPending) return plants;
    return plants.filter((p) => !isValidated(p.id));
  }, [plants, onlyPending, isValidated]);

  const current = visiblePlants[index] || null;
  const entry = current ? candidatesById[current.id] : null;
  const list = entry?.candidates || [];

  useEffect(() => {
    if (index >= visiblePlants.length) {
      setIndex(Math.max(0, visiblePlants.length - 1));
    }
  }, [index, visiblePlants.length]);

  const generateRembg = useCallback(async (c, cacheKey) => {
    setRembgLoadingKey(cacheKey);
    setError(null);
    try {
      const res = await fetch("/api/local/plant-photo-rembg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cacheKey,
          imageUrl: c.hdUrl || c.thumbnailUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.hint || data.message || data.error || "rembg_failed");
      }
      setRembgByKey((prev) => ({
        ...prev,
        [cacheKey]: {
          previewUrl: data.previewUrl,
          rembgCacheFile: data.rembgCacheFile,
        },
      }));
      return data;
    } catch (e) {
      setError(e.message || "Détourage impossible.");
      return null;
    } finally {
      setRembgLoadingKey(null);
    }
  }, []);

  const persistChoice = useCallback(
    async (payload) => {
      if (!current) return;
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/local/plant-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ catalogueId: current.id, univers, ...payload }),
        });
        if (!res.ok) throw new Error("save_failed");
        const data = await res.json();
        setChoices(data.choices || {});
        setIndex((i) => Math.min(i + 1, Math.max(0, visiblePlants.length - 1)));
      } catch {
        setError("Enregistrement impossible.");
      }
      setSaving(false);
    },
    [current, visiblePlants.length]
  );

  const pickCandidate = useCallback(
    async (candidateIndex) => {
      const candidate = list[candidateIndex];
      if (!candidate || !current) return;

      let rembgCacheFile = null;
      const cacheKey = candidateCacheKey(current.id, candidate);

      if (displayVariant === "white_bg") {
        let cached = rembgByKey[cacheKey];
        if (!cached) {
          const gen = await generateRembg(candidate, cacheKey);
          if (!gen) return;
          cached = { rembgCacheFile: gen.rembgCacheFile, previewUrl: gen.previewUrl };
        }
        rembgCacheFile = cached.rembgCacheFile;
      }

      await persistChoice({
        status: "selected",
        candidateIndex,
        candidate,
        displayVariant,
        rembgCacheFile,
      });
    },
    [list, current, displayVariant, rembgByKey, generateRembg, persistChoice]
  );

  const pickNone = useCallback(() => persistChoice({ status: "none" }), [persistChoice]);

  useEffect(() => {
    const onKey = (e) => {
      if (saving || !current) return;
      if (e.key >= "1" && e.key <= "8") {
        const idx = Number(e.key) - 1;
        if (list[idx]) {
          e.preventDefault();
          pickCandidate(idx);
        }
      }
      if (e.key === "0") {
        e.preventDefault();
        pickNone();
      }
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setDisplayVariant((v) => (v === "original" ? "white_bg" : "original"));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, visiblePlants.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, current, list, visiblePlants.length, pickCandidate, pickNone]);

  return (
    <>
      <Head>
        <title>Validation photos catalogue — local</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "#F2EEE7",
          fontFamily: "system-ui, sans-serif",
          color: "#1F2A22",
          padding: "20px 16px 32px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <header>
            <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Photos catalogue</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#5B6359" }}>
              Wikimedia + Pixabay · 1–8 choisir · 0 aucune · B original / fond blanc · ← → naviguer
            </p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { id: "vegetal", label: "Végétal" },
                { id: "mineral", label: "Minéral" },
                { id: "amenagements", label: "Aménagements" },
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setUnivers(u.id);
                    setIndex(0);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: univers === u.id ? "2px solid #1F2A22" : "1px solid #E4DED3",
                    background: univers === u.id ? "#FFFFFF" : "#FAF8F4",
                    fontWeight: univers === u.id ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </header>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              {validatedCount} / {plants.length} validées
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#5B6359" }}>
                Validation :{" "}
                <strong>{displayVariant === "white_bg" ? "fond blanc" : "original"}</strong> (B)
              </span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={onlyPending}
                  onChange={(e) => {
                    setOnlyPending(e.target.checked);
                    setIndex(0);
                  }}
                />
                Non validées seulement
              </label>
            </div>
          </div>

          {loading ? <p style={{ fontSize: 14 }}>Chargement…</p> : null}
          {error ? <p style={{ fontSize: 14, color: "#b00020" }}>{error}</p> : null}

          {!loading && visiblePlants.length === 0 ? (
            <p style={{ fontSize: 14 }}>Aucune plante à afficher.</p>
          ) : null}

          {current ? (
            <>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  border: "1.5px solid #EEE9E0",
                }}
              >
                <div style={{ fontSize: 12, color: "#5B6359", marginBottom: 4 }}>{current.categorie}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{current.nom}</div>
                <div style={{ fontSize: 14, fontStyle: "italic", color: "#5B6359" }}>{current.nom_latin}</div>
                <div style={{ fontSize: 12, color: "#5B6359", marginTop: 8 }}>
                  {index + 1} / {visiblePlants.length} affichées
                </div>
              </div>

              {list.length === 0 ? (
                <p style={{ fontSize: 14, color: "#5B6359" }}>
                  Aucune candidate — lancez{" "}
                  <code>{`node scripts/find-plant-photos.mjs --univers ${univers}`}</code>.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {list.map((c, i) => {
                    const cacheKey = candidateCacheKey(current.id, c);
                    const src = previewUrlForCandidate(c, displayVariant, rembgByKey, cacheKey);
                    const rembgReady = Boolean(rembgByKey[cacheKey]);
                    return (
                      <div
                        key={cacheKey}
                        style={{
                          border: "1.5px solid #EEE9E0",
                          borderRadius: 14,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => pickCandidate(i)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: 0,
                            border: "none",
                            background: PHOTO_BG,
                            cursor: saving ? "wait" : "pointer",
                          }}
                        >
                          <div
                            style={{
                              height: 320,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background:
                                displayVariant === "white_bg" && rembgReady ? "#FFFFFF" : PHOTO_BG,
                            }}
                          >
                            <img
                              src={src}
                              alt=""
                              style={{
                                maxWidth: "100%",
                                maxHeight: 320,
                                objectFit: "contain",
                                display: "block",
                              }}
                            />
                          </div>
                        </button>
                        <div style={{ padding: "10px 12px", fontSize: 13, color: "#5B6359" }}>
                          <div style={{ fontWeight: 600, color: "#1F2A22", marginBottom: 4 }}>
                            [{i + 1}] {c.source} — {c.searchQuery}
                          </div>
                          <div>{c.author}</div>
                          <div>
                            {c.licenseName}
                            {c.licenseUrl ? (
                              <>
                                {" "}
                                (
                                <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
                                  licence
                                </a>
                                )
                              </>
                            ) : null}
                          </div>
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <button
                              type="button"
                              disabled={rembgLoadingKey === cacheKey}
                              onClick={() => generateRembg(c, cacheKey)}
                              style={{
                                fontSize: 12,
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #E4DED3",
                                background: rembgReady ? "#E8F5E9" : "#fff",
                                cursor: rembgLoadingKey === cacheKey ? "wait" : "pointer",
                              }}
                            >
                              {rembgLoadingKey === cacheKey
                                ? "Détourage…"
                                : rembgReady
                                  ? "Fond blanc (cache)"
                                  : "Fond blanc"}
                            </button>
                            <a
                              href={c.pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 12, alignSelf: "center" }}
                            >
                              Page source
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={pickNone}
                style={{
                  minHeight: 48,
                  borderRadius: 12,
                  border: "1.5px solid #E4DED3",
                  background: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                Aucune ne convient (0)
              </button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
