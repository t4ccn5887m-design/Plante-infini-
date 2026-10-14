/**
 * Fiche plante catalogue — sevya/8-fiche.html
 */

import { useCallback, useEffect, useState } from "react";
import CataloguePhotoCredit from "@/components/catalogue/CataloguePhotoCredit";
import CataloguePlantVisual from "@/components/catalogue/CataloguePlantVisual";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import {
  isCatalogueItemInGarden,
  loadAllCatalogueGardenState,
  toggleCatalogueItemInGarden,
} from "@/lib/catalogueGardenToggle";

function InfoCell({ label, value }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mute)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{value || "—"}</div>
    </div>
  );
}

export default function CataloguePlantFicheScreen({
  plantId,
  t,
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const plant = getCataloguePlantById(plantId);
  const [gardenState, setGardenState] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  const refreshGarden = useCallback(async () => {
    try {
      setGardenState(await loadAllCatalogueGardenState());
    } catch {
      setGardenState(null);
    }
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden, plantId]);

  if (!plant) {
    return (
      <div style={{ padding: 24, fontSize: 14, color: "#5B6359" }}>
        Plante introuvable.
        <button type="button" onClick={onBack} style={{ display: "block", marginTop: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  const inGarden =
    gardenState && isCatalogueItemInGarden("vegetal", plant.id, gardenState);

  const coldLabel =
    plant.rusticite ||
    (plant.rusticite_c != null && plant.rusticite_c !== ""
      ? `Jusqu'à ${plant.rusticite_c} °C`
      : "—");

  const handleToggle = async () => {
    if (toggling || !gardenState) return;
    setError(null);
    setToggling(true);
    try {
      const result = await toggleCatalogueItemInGarden({
        universe: "vegetal",
        raw: plant,
        id: plant.id,
        t,
        state: gardenState,
        canAddToGarden,
        onRequireAccount,
      });
      if (result.gated) return;
      if (!result.ok) setError(result.error || "unknown");
      else {
        await refreshGarden();
        onGardenChange?.();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="atelier-fiche">
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: 400,
            flexShrink: 0,
            position: "relative",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <CataloguePlantVisual
              photo_url={plant.photo_url}
              categorie={plant.categorie}
              height={280}
              leafStroke="rgba(255,255,255,0.9)"
              photoDetouree={plant.photo_detouree}
            />
            <CataloguePhotoCredit plant={plant} />
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "var(--card)",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: "var(--card)",
                border: "1px solid var(--line)",
                color: "var(--clay)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Idée
            </span>
          </div>
        </div>

        <div className="atelier-fiche__panel">
          <p className="atelier-label atelier-fiche__cat">{plant.categorie}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h1 className="atelier-fiche__name">{plant.nom}</h1>
            {plant.nom_latin ? (
              <span className="atelier-latin" style={{ fontSize: 14 }}>{plant.nom_latin}</span>
            ) : null}
          </div>

          <div className="atelier-fiche__spec">
            <div>
              <span>Soleil</span>
              <b>{plant.exposition || "—"}</b>
            </div>
            <div>
              <span>Eau</span>
              <b>{plant.arrosage || "—"}</b>
            </div>
            <div>
              <span>Froid</span>
              <b>{coldLabel}</b>
            </div>
          </div>

          {plant.pourquoi_on_laime ? (
            <p className="atelier-fiche__phrase">{plant.pourquoi_on_laime}</p>
          ) : null}

          {plant.ambiances?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  color: "#5B6359",
                }}
              >
                SE RETROUVE DANS LES AMBIANCES
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {plant.ambiances.map((a) => (
                  <span
                    key={a}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "#ECE6F5",
                      color: "#5E4C8C",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {plant.a_savoir?.trim() ? (
            <div className="atelier-fiche__savoir">
              <span className="atelier-label">À savoir</span>
              <p>{plant.a_savoir}</p>
            </div>
          ) : null}

          {error ? <p style={{ margin: 0, fontSize: 13, color: "#c0392b" }}>{String(error)}</p> : null}
        </div>
      </div>

      <div style={{ padding: "12px 18px 18px", borderTop: "1.5px solid var(--line)" }}>
        {inGarden ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            style={{
              width: "100%",
              minHeight: 54,
              border: "1px solid var(--clay)",
              borderRadius: 18,
              background: "var(--card)",
              color: "var(--clay)",
              fontFamily: "inherit",
              fontSize: 17,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: toggling ? "wait" : "pointer",
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                fill="var(--clay)"
                stroke="var(--clay)"
                strokeWidth={2.2}
              />
            </svg>
            Dans mes coups de cœur
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            style={{
              width: "100%",
              minHeight: 54,
              border: "none",
              borderRadius: 18,
              background: "var(--sage)",
              color: "var(--bg)",
              fontFamily: "inherit",
              fontSize: 17,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: toggling ? "wait" : "pointer",
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ajouter à mes coups de cœur
          </button>
        )}
      </div>
    </div>
  );
}
