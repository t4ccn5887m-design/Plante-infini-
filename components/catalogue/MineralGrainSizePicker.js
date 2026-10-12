import { MINERAL_GRAIN_OPTIONS } from "@/lib/catalogueMineralGrain";

const dotStyle = (variant) => ({
  width: 64,
  height: 44,
  borderRadius: 10,
  backgroundColor: "#F2EEE7",
  backgroundImage:
    variant === "fin"
      ? "radial-gradient(circle, #8E8A83 1.6px, transparent 1.9px)"
      : variant === "moyen"
        ? "radial-gradient(circle, #8E8A83 3.2px, transparent 3.6px)"
        : "radial-gradient(circle, #8E8A83 6px, transparent 6.5px)",
  backgroundSize: variant === "fin" ? "6px 6px" : variant === "moyen" ? "11px 11px" : "19px 19px",
});

export default function MineralGrainSizePicker({ value, onChange }) {
  return (
    <section>
      <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#1F2A22" }}>
        Taille des grains
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {MINERAL_GRAIN_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange?.(selected ? null : opt.id)}
              style={{
                border: selected ? "2px solid #2F5E3F" : "1.5px solid #E4DED3",
                borderRadius: 18,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "#FFFFFF",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={dotStyle(opt.id)} aria-hidden="true" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A22" }}>{opt.label}</span>
              <span style={{ fontSize: 11.5, color: "#5B6359", fontStyle: "normal" }}>{opt.range}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
