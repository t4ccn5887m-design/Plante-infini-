import { useCallback, useEffect, useMemo, useState } from "react";
import { demoteGardenCoupsItem, loadGardenCoupsItems } from "@/lib/gardenCoupsItems";
import { cataloguePhotoFillStyle } from "@/lib/cataloguePhotoDisplay";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const PLACEHOLDER_COLORS = ["#8C7AB0", "#7E8F6A", "#5F7BB0", "#A8925F", "#B9667F", "#6F8A5C"];

function hashColor(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
}

function HeartFilled() {
  return (
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
  );
}

function FilterPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 36,
        padding: "0 14px",
        borderRadius: 999,
        border: active ? "none" : "1.5px solid #E4DED3",
        background: active ? "#1F2A22" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#4D554B",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CoupsCard({ item, removing, onOpen, onRemove }) {
  const photo = item.photo;
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: "1.5px solid #EEE9E0",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 86,
          position: "relative",
          background: photo ? "#DDD7CC" : hashColor(item.nom),
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          padding: 6,
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...cataloguePhotoFillStyle(photo),
            }}
          />
        ) : null}
        <button
          type="button"
          aria-label={`Retirer ${item.nom} de vos coups de cœur`}
          disabled={removing}
          onClick={() => onRemove(item)}
          style={{
            position: "relative",
            zIndex: 1,
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "none",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: removing ? "wait" : "pointer",
          }}
        >
          <HeartFilled />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onOpen(item)}
        disabled={removing}
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
          {item.nom}
        </span>
        <span style={{ fontSize: 12, color: "#5B6359" }}>{item.originLabel}</span>
      </button>
    </div>
  );
}

export default function CoupsDeCoeurScreen({
  refreshTick = 0,
  scansCount = 0,
  onOpenItem,
  onOpenMesScans,
  onScan,
  onOpenIdees,
  onGardenChange,
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [demoteMaps, setDemoteMaps] = useState(null);
  const [filter, setFilter] = useState("all");
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadGardenCoupsItems();
      setItems(data.items);
      setDemoteMaps(data.demote);
    } catch (e) {
      setError(e?.message || "unknown");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshTick]);

  const filtered = useMemo(() => {
    if (filter === "scans") return items.filter((i) => !i.isIdea);
    if (filter === "idees") return items.filter((i) => i.isIdea);
    return items;
  }, [items, filter]);

  const handleRemove = async (item) => {
    if (!demoteMaps || removingId) return;
    const ok = window.confirm(`Retirer ${item.nom} de vos coups de cœur ?`);
    if (!ok) return;

    setRemovingId(item.paletteItemId);
    const result = await demoteGardenCoupsItem(item, demoteMaps);
    if (!result.ok) {
      setError(result.error || "unknown");
    } else {
      onGardenChange?.();
      await refresh();
    }
    setRemovingId(null);
  };

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "18px 18px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1F2A22" }}>Coups de cœur</h1>
        <span style={{ fontSize: 14, color: "#5B6359" }}>Tout ce qui ira dans votre dossier.</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          Tout
        </FilterPill>
        <FilterPill active={filter === "scans"} onClick={() => setFilter("scans")}>
          Scans
        </FilterPill>
        <FilterPill active={filter === "idees"} onClick={() => setFilter("idees")}>
          Idées
        </FilterPill>
      </div>

      {error ? (
        <p style={{ margin: 0, fontSize: 13, color: COLORS.error }}>{String(error)}</p>
      ) : null}

      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, textAlign: "center", padding: 24 }}>
          Chargement…
        </p>
      ) : items.length === 0 ? (
        <div
          style={{
            borderRadius: 18,
            border: "1.5px solid #EEE9E0",
            padding: "22px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "stretch",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1F2A22" }}>
            Aucun coup de cœur pour l&apos;instant
          </span>
          <button
            type="button"
            onClick={onScan}
            style={{
              minHeight: 44,
              borderRadius: 14,
              background: "#2F5E3F",
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Scanner une plante
          </button>
          <button
            type="button"
            onClick={onOpenIdees}
            style={{
              minHeight: 44,
              borderRadius: 14,
              background: "#FFFFFF",
              color: "#2F5E3F",
              border: "1.5px solid #EEE9E0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Piocher une idée
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {filtered.map((item) => (
            <CoupsCard
              key={item.paletteItemId}
              item={item}
              removing={removingId === item.paletteItemId}
              onOpen={onOpenItem}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenMesScans}
        style={{
          alignSelf: "center",
          marginTop: 8,
          marginBottom: 4,
          border: "none",
          background: "transparent",
          color: COLORS.active,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          minHeight: 44,
          padding: "0 8px",
        }}
      >
        Tous mes scans ({scansCount})
      </button>
    </div>
  );
}
