import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function CatalogueArticleRow({
  article,
  inGarden,
  toggling,
  onToggle,
  t,
  tint,
  ink,
  fallbackIcon,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 13,
        padding: "8px 10px 8px 8px",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: ink,
          overflow: "hidden",
        }}
      >
        {article.photo_url ? (
          <img src={article.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          fallbackIcon
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {article.nom}
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.muted,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {article.resume}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(article)}
        disabled={toggling}
        style={{
          flex: "none",
          height: 33,
          padding: "0 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          cursor: toggling ? "wait" : "pointer",
          fontFamily: "inherit",
          border: inGarden ? "none" : `0.5px solid ${COLORS.borderStrong}`,
          background: inGarden ? tint : "#fff",
          color: inGarden ? ink : COLORS.ink,
          opacity: toggling ? 0.65 : 1,
        }}
      >
        {inGarden ? (
          <>
            <IconCheck /> {t("catalogue.in_garden")}
          </>
        ) : (
          <>
            <IconPlus /> {t("catalogue.add_to_garden")}
          </>
        )}
      </button>
    </div>
  );
}
