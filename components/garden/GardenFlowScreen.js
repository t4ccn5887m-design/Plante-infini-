/** En-tête retour commun aux écrans dossier (ambiance, terrain, budget). */

export function GardenBackButton({ onBack, label = "Retour" }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={label}
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
        flexShrink: 0,
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m15 18-6-6 6-6"
          stroke="#1F2A22"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function GardenFlowScreen({ children, footer }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#FFFFFF",
      }}
    >
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>{children}</div>
      {footer ? (
        <div
          style={{
            padding: "12px 18px 18px",
            borderTop: "1.5px solid #EEE9E0",
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
