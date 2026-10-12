import { useEffect, useMemo, useState } from "react";
import RealisationPastille from "@/components/catalogue/RealisationPastille";
import { getAllGardenStyles } from "@/lib/catalogueStyles";

function useGridColumns() {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const update = () => {
      const w = window.innerWidth;
      if (w >= 960) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

export default function GardenStylesWallScreen({ onBack, onOpenStyle }) {
  const styles = useMemo(() => getAllGardenStyles(), []);
  const cols = useGridColumns();

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "12px 12px 16px",
        background: "var(--bg, #0F1A14)",
      }}
    >
      <div style={{ padding: "6px 6px 12px" }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "#F2EEE7",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 26,
            lineHeight: 1,
            color: "#1F2A22",
            paddingBottom: 3,
          }}
        >
          ‹
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onOpenStyle?.(style.id)}
            style={{
              padding: 0,
              border: "none",
              borderRadius: 18,
              overflow: "hidden",
              cursor: "pointer",
              background: "#E4DDD2",
              aspectRatio: "3 / 4",
              position: "relative",
            }}
          >
            {style.pastille ? <RealisationPastille label={style.pastille} /> : null}
            <img
              src={style.photo_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
