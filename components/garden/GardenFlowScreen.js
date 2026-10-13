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
        background: "var(--card)",
        border: "1px solid var(--line)",
        display: "flex",
        color: "var(--ink)",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m15 18-6-6 6-6"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function GardenPrimaryButton({ children, disabled, onClick }) {
  const GREEN = "var(--sage)";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 54,
        borderRadius: 18,
        border: "none",
        background: disabled ? "var(--line)" : "var(--ink)",
        color: "var(--bg)",
        fontSize: 17,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.85 : 1,
      }}
    >
      {children}
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
        background: "var(--bg)",
      }}
    >
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>{children}</div>
      {footer ? (
        <div
          style={{
            padding: "12px 18px 18px",
            borderTop: "1.5px solid var(--line)",
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
