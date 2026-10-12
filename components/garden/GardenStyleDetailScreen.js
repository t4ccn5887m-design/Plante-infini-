import { useCallback, useEffect, useState } from "react";
import CataloguePhotoCredit from "@/components/catalogue/CataloguePhotoCredit";
import RealisationPastille from "@/components/catalogue/RealisationPastille";
import { loadCatalogueStyleGardenState } from "@/lib/promoteCatalogueToGarden";
import { getGardenStyleById } from "@/lib/catalogueStyles";
import { toggleGardenStyleInGarden } from "@/lib/catalogueStyleGardenToggle";

const GREEN = "#2F5E3F";

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

  if (!style) {
    return (
      <div style={{ padding: 24 }}>
        <button type="button" onClick={onBack}>
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
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#0f1410",
      }}
    >
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={style.photo_url}
            alt=""
            style={{ width: "100%", maxHeight: "min(72vh, 720px)", objectFit: "cover", display: "block" }}
          />
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}>
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "rgba(255,255,255,0.92)",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
              }}
            >
              ‹
            </button>
          </div>
          {style.pastille ? (
            <RealisationPastille label={style.pastille} style={{ top: 12, left: 64 }} />
          ) : null}
          {style.photo_auteur ? <CataloguePhotoCredit plant={style} onDark /> : null}
        </div>

        <div style={{ padding: "16px 18px 28px", background: "#FAF8F4", flexGrow: 1 }}>
          {error ? <p style={{ margin: "0 0 12px", fontSize: 13, color: "#b42318" }}>{error}</p> : null}
          <button
            type="button"
            disabled={toggling || !styleState}
            onClick={handleToggle}
            style={{
              width: "100%",
              minHeight: 54,
              borderRadius: 18,
              border: "none",
              background: inGarden ? "#ECE6F5" : GREEN,
              color: inGarden ? "#5E4C8C" : "#FFFFFF",
              fontSize: 16,
              fontWeight: 700,
              cursor: toggling ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {inGarden ? "♥ Retiré de vos coups de cœur" : "♡ J'aime ce jardin"}
          </button>
        </div>
      </div>
    </div>
  );
}
