const GREEN = "#2F5E3F";

export default function RealisationPastille({ label = "Réalisation", style = {} }) {
  if (!label) return null;
  return (
    <span
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 2,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        background: GREEN,
        color: "#FFFFFF",
        letterSpacing: 0.2,
        pointerEvents: "none",
        ...style,
      }}
    >
      {label}
    </span>
  );
}
