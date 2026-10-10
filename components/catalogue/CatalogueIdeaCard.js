import CataloguePlantVisual from "@/components/catalogue/CataloguePlantVisual";
import CatalogueUniverseVisual from "@/components/catalogue/CatalogueUniverseVisual";

export function HeartToggle({ filled, disabled, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "none",
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "wait" : "pointer",
        position: "relative",
        zIndex: 1,
      }}
    >
      {filled ? (
        <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            fill="#C0652E"
            stroke="#C0652E"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            stroke="#4D554B"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export default function CatalogueIdeaCard({
  nom,
  subtitle,
  photo_url,
  categorie,
  catalogUniverse = "vegetal",
  inGarden,
  toggling,
  onOpen,
  onToggleHeart,
  imageHeight = 118,
  borderRadius = 20,
  titleSize = 15,
  showHeart = true,
}) {
  return (
    <div
      style={{
        borderRadius,
        overflow: "hidden",
        border: "1.5px solid #EEE9E0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          height: imageHeight,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          padding: showHeart ? 8 : 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {catalogUniverse === "vegetal" ? (
            <CataloguePlantVisual photo_url={photo_url} categorie={categorie} height={imageHeight} />
          ) : (
            <CatalogueUniverseVisual
              photo_url={photo_url}
              universe={catalogUniverse === "mineral" ? "mineral" : "amenagements"}
              height={imageHeight}
              photoFit={catalogUniverse === "mineral" ? "cover" : "contain"}
            />
          )}
        </div>
        {showHeart ? (
          <HeartToggle
            filled={inGarden}
            disabled={toggling}
            label={
              inGarden ? `Retirer ${nom} de vos coups de cœur` : `Ajouter ${nom} à vos coups de cœur`
            }
            onClick={onToggleHeart}
          />
        ) : null}
      </div>
      <button
        type="button"
        onClick={onOpen}
        disabled={toggling}
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          color: "#1F2A22",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {nom}
        </span>
        {subtitle ? (
          <span style={{ fontSize: 12, color: "#5B6359", lineHeight: 1.35 }}>{subtitle}</span>
        ) : null}
      </button>
    </div>
  );
}
