import { useCallback, useEffect, useState } from "react";
import CataloguePhotoCredit from "@/components/catalogue/CataloguePhotoCredit";
import CatalogueUniverseVisual from "@/components/catalogue/CatalogueUniverseVisual";
import RealisationPastille from "@/components/catalogue/RealisationPastille";
import MineralGrainSizePicker from "@/components/catalogue/MineralGrainSizePicker";
import { getCatalogueAmenagementById } from "@/lib/catalogueAmenagements";
import { loadMineralGrainChoice, saveMineralGrainChoice } from "@/lib/catalogueMineralGrain";
import { getCatalogueMineralById } from "@/lib/catalogueMinerals";
import {
  isCatalogueItemInGarden,
  loadAllCatalogueGardenState,
  toggleCatalogueItemInGarden,
} from "@/lib/catalogueGardenToggle";

function resolveItem(universe, id) {
  if (universe === "mineral") return getCatalogueMineralById(id);
  return getCatalogueAmenagementById(id);
}

function universeKindLabel(universe) {
  return universe === "mineral" ? "Paillage" : "Bordure";
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
  const [grainSize, setGrainSize] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  useEffect(() => {
    if (universe === "mineral" && itemId) {
      setGrainSize(loadMineralGrainChoice(itemId));
    } else {
      setGrainSize(null);
    }
  }, [universe, itemId]);

  useEffect(() => {
    setGalleryIndex(0);
  }, [itemId, universe]);

  if (!item) {
    return (
      <div style={{ padding: 24, fontSize: 14, color: "var(--mute)" }}>
        Élément introuvable.
        <button type="button" className="atelier-btn-secondary" onClick={onBack} style={{ display: "block", marginTop: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  const inGarden =
    gardenState && isCatalogueItemInGarden(gardenUniverse, item.id, gardenState);

  const photoGallery =
    item.photo_gallery?.length > 0
      ? item.photo_gallery
      : item.photo_url
        ? [item.photo_url]
        : [];
  const showGalleryCarousel = photoGallery.length > 1;
  const activePhotoUrl = photoGallery[galleryIndex] || item.photo_url;
  const isRealisationPhoto = String(item.photo_source || "")
    .toLowerCase()
    .includes("realisation");

  const poseLabel =
    (item.usages && item.usages[0]) || item.aspect || "—";
  const catLine = `${universeKindLabel(universe)} · ${(item.categorie || "").toUpperCase()}`;

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
          <div style={{ position: "absolute", inset: 0, margin: 0 }}>
            {showGalleryCarousel ? (
              <div
                className="atelier-fiche__gallery-scroll"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const w = el.clientWidth || 1;
                  const idx = Math.round(el.scrollLeft / w);
                  if (idx !== galleryIndex && idx >= 0 && idx < photoGallery.length) {
                    setGalleryIndex(idx);
                  }
                }}
              >
                {photoGallery.map((url) => (
                  <div key={url} className="atelier-fiche__gallery-slide">
                    <img src={url} alt="" />
                    {isRealisationPhoto ? <RealisationPastille /> : null}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <CatalogueUniverseVisual
                  photo_url={activePhotoUrl}
                  universe={universe === "mineral" ? "mineral" : "amenagements"}
                  height={400}
                  photoFit={isRealisationPhoto ? "cover" : photoFit}
                  photoDetouree={item.photo_detouree}
                />
                {isRealisationPhoto ? <RealisationPastille /> : null}
              </>
            )}
            {item.photo_auteur ? <CataloguePhotoCredit plant={item} /> : null}
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              className="atelier-fiche__back"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="atelier-fiche__panel">
          <p className="atelier-label atelier-fiche__cat">{catLine}</p>
          <h1 className="atelier-fiche__name">{item.nom}</h1>

          {item.pourquoi_on_laime ? (
            <p className="atelier-fiche__phrase">{item.pourquoi_on_laime}</p>
          ) : null}

          <div className="atelier-fiche__spec">
            <div>
              <span>Budget</span>
              <b>{item.budget || "—"}</b>
            </div>
            <div>
              <span>Entretien</span>
              <b>{item.entretien || "—"}</b>
            </div>
            <div>
              <span>Pose</span>
              <b>{poseLabel}</b>
            </div>
          </div>

          {item.a_savoir?.trim() ? (
            <div className="atelier-fiche__savoir">
              <span className="atelier-label">À savoir</span>
              <p>{item.a_savoir}</p>
            </div>
          ) : null}

          {universe === "mineral" ? (
            <MineralGrainSizePicker
              value={grainSize}
              onChange={(next) => {
                setGrainSize(next);
                saveMineralGrainChoice(item.id, next);
              }}
            />
          ) : null}

          {error ? <p style={{ margin: 0, fontSize: 13, color: "var(--clay)" }}>{String(error)}</p> : null}
        </div>
      </div>

      <div className="atelier-fiche__foot">
        <button
          type="button"
          className={inGarden ? "atelier-btn-secondary" : "atelier-btn-secondary atelier-fiche__heart-outline"}
          disabled={toggling || !gardenState}
          onClick={handleToggle}
        >
          {inGarden ? "Retirer de mes coups de cœur" : "Ajouter à mes coups de cœur"}
        </button>
      </div>
    </div>
  );
}
