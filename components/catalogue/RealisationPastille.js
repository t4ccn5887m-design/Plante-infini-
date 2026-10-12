export default function RealisationPastille({ label = "Réalisation", style = {} }) {
  if (!label) return null;
  return (
    <span
      className="realisation-pastille"
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 2,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        background: "var(--sage, #C9D6B8)",
        color: "var(--bg, #0F1A14)",
        letterSpacing: 0.2,
        pointerEvents: "none",
        ...style,
      }}
    >
      {label}
    </span>
  );
}
