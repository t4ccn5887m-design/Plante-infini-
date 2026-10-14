import { useCallback, useEffect, useState } from "react";
import CataloguePhotoCredit from "@/components/catalogue/CataloguePhotoCredit";
import RealisationPastille from "@/components/catalogue/RealisationPastille";
import { loadCatalogueStyleGardenState } from "@/lib/promoteCatalogueToGarden";
import { getGardenStyleById } from "@/lib/catalogueStyles";
import { toggleGardenStyleInGarden } from "@/lib/catalogueStyleGardenToggle";

export default function GardenStyleDetailScreen({
  styleId,
  t,
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const style = getGardenStyleById(styleId);
  const [inGarden, setInGarden] = useState(false);
  const [styleState, setStyleState] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const st = await loadCatalogueStyleGardenState();
      setStyleState(st);
      setInGarden(st.inGarden.has(styleId));
    } catch {
      setStyleState(null);
    }
  }, [styleId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!style?.photo_url) {
    return (
      <div style={{ padding: 24, background: "var(--bg)", color: "var(--ink)", flex: 1 }}>
        <button type="button" className="atelier-btn-secondary" onClick={onBack}>
          Retour
        </button>
      </div>
    );
  }

  const handleToggle = async () => {
    if (toggling || !styleState) return;
    setError(null);
    setToggling(true);
    try {
      const result = await toggleGardenStyleInGarden({
        style,
        t,
        state: { styles: styleState },
        canAddToGarden,
        onRequireAccount,
      });
      if (result.gated) return;
      if (!result.ok) setError(result.error || "unknown");
      else {
        await refresh();
        onGardenChange?.();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="atelier-style-detail">
      <img className="atelier-style-detail__photo" src={style.photo_url} alt="" />
      <div className="atelier-style-detail__shade" aria-hidden="true" />
      <div className="atelier-style-detail__top">
        <button type="button" className="atelier-style-detail__back" onClick={onBack} aria-label="Retour">
          ‹
        </button>
        {style.pastille ? (
          <RealisationPastille label={style.pastille} style={{ position: "relative", top: 0, left: 0 }} />
        ) : null}
      </div>
      {style.photo_auteur ? (
        <div className="atelier-style-detail__credit">
          <CataloguePhotoCredit plant={style} onDark />
        </div>
      ) : null}
      <div className="atelier-style-detail__footer">
        {error ? (
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--danger)", textAlign: "center" }}>{error}</p>
        ) : null}
        <button
          type="button"
          className={
            inGarden
              ? "atelier-btn-secondary atelier-style-detail__heart-on"
              : "atelier-btn-fill atelier-style-detail__heart-btn"
          }
          disabled={toggling || !styleState}
          onClick={handleToggle}
        >
          {inGarden ? "♥ Retirer de vos coups de cœur" : "♡ J'aime ce jardin"}
        </button>
      </div>
    </div>
  );
}
