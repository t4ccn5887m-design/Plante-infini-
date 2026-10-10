/**
 * Fiche plante catalogue — sevya/8-fiche.html
 */

import { useCallback, useEffect, useState } from "react";
import CataloguePlantVisual from "@/components/catalogue/CataloguePlantVisual";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import {
  isCatalogueItemInGarden,
  loadAllCatalogueGardenState,
  toggleCatalogueItemInGarden,
} from "@/lib/catalogueGardenToggle";

function InfoCell({ label, value }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 14, background: "#FAF8F4" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7268" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2A22", marginTop: 2 }}>{value || "—"}</div>
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
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: 280,
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
            />
            {plant.photo_url && plant.photo_auteur ? (
              <p
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: 0,
                  padding: "8px 12px",
                  fontSize: 11,
                  color: "#6B7268",
                  background: "linear-gradient(transparent, rgba(255,255,255,0.92))",
                }}
              >
                Photo :{" "}
                {plant.photo_lien ? (
                  <a href={plant.photo_lien} target="_blank" rel="noopener noreferrer" style={{ color: "#6B7268" }}>
                    {plant.photo_auteur}
                  </a>
                ) : (
                  plant.photo_auteur
                )}{" "}
                / Pixabay
              </p>
            ) : null}
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
                background: "#FFFFFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m15 18-6-6 6-6" stroke="#1F2A22" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: "#FFFFFF",
                color: "#6A5896",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Idée
            </span>
          </div>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1F2A22" }}>{plant.nom}</h1>
            {plant.nom_latin ? (
              <span style={{ fontSize: 14, fontStyle: "italic", color: "#5B6359" }}>{plant.nom_latin}</span>
            ) : null}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            <InfoCell label="EXPOSITION" value={plant.exposition} />
            <InfoCell label="ENTRETIEN" value={plant.entretien} />
            <InfoCell label="ARROSAGE" value={plant.arrosage} />
            <InfoCell label="RÉSISTE AU FROID" value={coldLabel} />
            <InfoCell label="TAILLE ADULTE" value={plant.hauteur_adulte || plant.taille_adulte} />
            <InfoCell label="FLORAISON" value={plant.floraison || "—"} />
          </div>

          {plant.pourquoi_on_laime ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  color: "#5B6359",
                }}
              >
                POURQUOI ON L&apos;AIME
              </span>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#3B4339" }}>
                {plant.pourquoi_on_laime}
              </p>
            </div>
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
            <div
              style={{
                borderRadius: 18,
                padding: "14px 16px",
                background: "#FDF2E6",
                border: "1.5px solid #F1D9C0",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <path
                  d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                  stroke="#A4501F"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 9v4" stroke="#A4501F" strokeWidth={2.2} strokeLinecap="round" />
                <path d="M12 17h.01" stroke="#A4501F" strokeWidth={2.2} strokeLinecap="round" />
              </svg>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#4A2A14" }}>
                <strong>À savoir :</strong> {plant.a_savoir}
              </p>
            </div>
          ) : null}

          {error ? <p style={{ margin: 0, fontSize: 13, color: "#c0392b" }}>{String(error)}</p> : null}
        </div>
      </div>

      <div style={{ padding: "12px 18px 18px", borderTop: "1.5px solid #EEE9E0" }}>
        {inGarden ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            style={{
              width: "100%",
              minHeight: 54,
              border: "1.5px solid #C0652E",
              borderRadius: 18,
              background: "#F6E7D8",
              color: "#8A4A22",
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
                fill="#C0652E"
                stroke="#C0652E"
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
              background: "#2F5E3F",
              color: "#FFFFFF",
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
