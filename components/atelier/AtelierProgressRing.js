/** Anneau de progression dossier (conic-gradient sage). */
export default function AtelierProgressRing({ percent = 0, size = 88, stroke = 6 }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const inner = size - stroke * 2;
  return (
    <div
      className="atelier-progress-ring"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(var(--sage) ${p * 3.6}deg, var(--line) 0)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden={false}
      role="img"
      aria-label={`Progression ${p} pour cent`}
    >
      <span
        style={{
          width: inner,
          height: inner,
          borderRadius: "50%",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-title, Fraunces, serif)",
          fontSize: size > 80 ? 15 : 13,
          fontWeight: 500,
          color: "var(--ink)",
        }}
      >
        {p}%
      </span>
    </div>
  );
}
