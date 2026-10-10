import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { isLocalPhotoAdminEnabled } from "@/lib/localPhotoAdmin";

export async function getServerSideProps() {
  if (!isLocalPhotoAdminEnabled()) {
    return { notFound: true };
  }
  return { props: {} };
}

export default function AdminPlantPhotosPage() {
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [candidatesById, setCandidatesById] = useState({});
  const [choices, setChoices] = useState({});
  const [index, setIndex] = useState(0);
  const [onlyPending, setOnlyPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/plant-photos");
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setPlants(data.plants || []);
      setCandidatesById(data.candidates || {});
      setChoices(data.choices || {});
    } catch {
      setError("Impossible de charger les données.");
    }
    setLoading(false);
  }, []);

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

  const persistChoice = useCallback(
    async (payload) => {
      if (!current) return;
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/local/plant-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ catalogueId: current.id, ...payload }),
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
    (candidateIndex) => {
      const candidate = list[candidateIndex];
      if (!candidate) return;
      persistChoice({ status: "selected", candidateIndex, candidate });
    },
    [list, persistChoice]
  );

  const pickNone = useCallback(() => persistChoice({ status: "none" }), [persistChoice]);

  useEffect(() => {
    const onKey = (e) => {
      if (saving || !current) return;
      if (e.key >= "1" && e.key <= "6") {
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
            <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Photos catalogue (Pixabay)</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#5B6359" }}>
              Local uniquement — raccourcis : 1–6 choisir, 0 aucune, ← → naviguer
            </p>
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

          {loading ? <p style={{ fontSize: 14 }}>Chargement…</p> : null}
          {error ? <p style={{ fontSize: 14, color: "#b00020" }}>{error}</p> : null}

          {!loading && visiblePlants.length === 0 ? (
            <p style={{ fontSize: 14 }}>Aucune plante à afficher (toutes validées ?).</p>
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
                  {index + 1} / {visiblePlants.length} affichées · id {current.id}
                </div>
              </div>

              {list.length === 0 ? (
                <p style={{ fontSize: 14, color: "#5B6359" }}>
                  Aucune candidate — lancez <code>node scripts/find-plant-photos.mjs</code>.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {list.map((c, i) => (
                    <button
                      key={c.pixabayId}
                      type="button"
                      disabled={saving}
                      onClick={() => pickCandidate(i)}
                      style={{
                        border: "1.5px solid #EEE9E0",
                        borderRadius: 14,
                        overflow: "hidden",
                        padding: 0,
                        background: "#fff",
                        cursor: saving ? "wait" : "pointer",
                        textAlign: "left",
                      }}
                    >
                      <img
                        src={c.previewUrl}
                        alt=""
                        style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }}
                      />
                      <span
                        style={{
                          display: "block",
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "#5B6359",
                        }}
                      >
                        [{i + 1}] {c.author} — Pixabay #{c.pixabayId}
                      </span>
                    </button>
                  ))}
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
