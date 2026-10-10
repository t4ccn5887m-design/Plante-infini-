import { hashCatalogueColor } from "@/lib/catalogueIdeesHelpers";

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
  inGarden,
  toggling,
  onOpen,
  onToggleHeart,
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: "1.5px solid #EEE9E0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 86,
          position: "relative",
          background: photo_url ? "#DDD7CC" : hashCatalogueColor(nom),
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          padding: 6,
        }}
      >
        {photo_url ? (
          <img
            src={photo_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
        <HeartToggle
          filled={inGarden}
          disabled={toggling}
          label={
            inGarden ? `Retirer ${nom} de vos coups de cœur` : `Ajouter ${nom} à vos coups de cœur`
          }
          onClick={onToggleHeart}
        />
      </div>
      <button
        type="button"
        onClick={onOpen}
        disabled={toggling}
        style={{
          padding: "8px 10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
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
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {nom}
        </span>
        <span style={{ fontSize: 12, color: "#5B6359", lineHeight: 1.35 }}>{subtitle}</span>
      </button>
    </div>
  );
}
