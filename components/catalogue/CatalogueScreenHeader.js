import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconBack() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export default function CatalogueScreenHeader({ crumb, title, subtitle, onBack }) {
  return (
    <>
      <div
        style={{
          padding: "15px 16px 10px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          style={{
            width: 32,
            height: 32,
            border: "none",
            background: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: COLORS.ink,
            flex: "none",
            padding: 0,
          }}
        >
          <IconBack />
        </button>
        <span style={{ fontSize: 14, color: COLORS.muted }}>{crumb}</span>
      </div>

      <div style={{ padding: "2px 16px 14px" }}>
        <h1
          className="wilder-v2-title-page"
          style={{ margin: 0, fontSize: 21, letterSpacing: "-0.01em", lineHeight: 1.15 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
}
