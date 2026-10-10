import { useCallback, useEffect, useState } from "react";
import CataloguePhotoCredit from "@/components/catalogue/CataloguePhotoCredit";
import CatalogueUniverseVisual from "@/components/catalogue/CatalogueUniverseVisual";
import { getCatalogueAmenagementById } from "@/lib/catalogueAmenagements";
import { getCatalogueMineralById } from "@/lib/catalogueMinerals";
import {
  isCatalogueItemInGarden,
  loadAllCatalogueGardenState,
  toggleCatalogueItemInGarden,
} from "@/lib/catalogueGardenToggle";

function InfoCell({ label, value, hint }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 14, background: "#FAF8F4" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7268" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2A22", marginTop: 2 }}>{value || "—"}</div>
      {hint ? (
        <div style={{ fontSize: 10, color: "#6B7268", marginTop: 4, lineHeight: 1.35 }}>{hint}</div>
      ) : null}
    </div>
  );
}

function resolveItem(universe, id) {
  if (universe === "mineral") return getCatalogueMineralById(id);
  return getCatalogueAmenagementById(id);
}

export default function CatalogueUniverseFicheScreen({
  universe,
  itemId,
  t,
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const item = resolveItem(universe, itemId);
  const gardenUniverse = universe === "mineral" ? "mineral" : "deco";
  const photoFit = universe === "mineral" ? "cover" : "contain";

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
  }, [refreshGarden, itemId, universe]);

  if (!item) {
    return (
      <div style={{ padding: 24, fontSize: 14, color: "#5B6359" }}>
        Élément introuvable.
        <button type="button" onClick={onBack} style={{ display: "block", marginTop: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  const inGarden =
    gardenState && isCatalogueItemInGarden(gardenUniverse, item.id, gardenState);

  const usagesLabel = (item.usages || []).join(", ") || "—";

  const handleToggle = async () => {
    if (toggling || !gardenState) return;
    setError(null);
    setToggling(true);
    try {
      const result = await toggleCatalogueItemInGarden({
        universe: gardenUniverse,
        raw: item,
        id: item.id,
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
            <CatalogueUniverseVisual
              photo_url={item.photo_url}
              universe={universe === "mineral" ? "mineral" : "amenagements"}
              height={280}
              photoFit={photoFit}
              photoDetouree={item.photo_detouree}
            />
            <CataloguePhotoCredit plant={item} />
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "none",
                background: "rgba(255,255,255,0.92)",
                cursor: "pointer",
                fontSize: 18,
              }}
              aria-label="Retour"
            >
              ←
            </button>
          </div>
        </div>

        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#5B6359", marginBottom: 4 }}>{item.categorie}</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1F2A22" }}>{item.nom}</h1>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <InfoCell label="Aspect" value={item.aspect} />
            <InfoCell label="Entretien" value={item.entretien} />
            <InfoCell
              label="Budget indicatif"
              value={item.budget}
              hint="Budget indicatif, à affiner avec votre paysagiste."
            />
            <InfoCell label="Usages" value={usagesLabel} />
          </div>

          {item.pourquoi_on_laime ? (
            <section>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>Pourquoi on l&apos;aime</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#3D4540" }}>
                {item.pourquoi_on_laime}
              </p>
            </section>
          ) : null}

          {item.ambiances?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {item.ambiances.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "#F2EEE7",
                    color: "#4D554B",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {item.a_savoir ? (
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: "#FFF8ED",
                border: "1px solid #F0E4D0",
                fontSize: 13,
                lineHeight: 1.5,
                color: "#5B4A3A",
              }}
            >
              <strong>À savoir — </strong>
              {item.a_savoir}
            </div>
          ) : null}

          {error ? <p style={{ margin: 0, fontSize: 13, color: "#b00020" }}>{error}</p> : null}

          <button
            type="button"
            disabled={toggling || !gardenState}
            onClick={handleToggle}
            style={{
              minHeight: 52,
              borderRadius: 14,
              border: "none",
              background: inGarden ? "#E8EDE3" : "#1F2A22",
              color: inGarden ? "#1F2A22" : "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              cursor: toggling ? "wait" : "pointer",
            }}
          >
            {inGarden ? "Retirer de mes coups de cœur" : "Ajouter à mes coups de cœur"}
          </button>
        </div>
      </div>
    </div>
  );
}
