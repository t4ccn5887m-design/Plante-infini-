/**
 * Idées — maquette sevya/3-idees.html
 * Catalogue unifié (végétal / minéral / déco / ambiances).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterCataloguePlants,
  plantToAnalysisResult,
} from "@/lib/cataloguePlants";
import {
  filterCatalogueMinerals,
  mineralToAnalysisResult,
} from "@/lib/catalogueMinerals";
import {
  decoToAnalysisResult,
  filterCatalogueDeco,
} from "@/lib/catalogueDeco";
import { getActiveGardenIdeas } from "@/lib/gardenIdeas";
import {
  demoteCatalogueDecoFromGarden,
  demoteCatalogueMineralFromGarden,
  demoteCataloguePlantFromGarden,
  loadCatalogueDecoGardenState,
  loadCatalogueGardenState,
  loadCatalogueMineralGardenState,
  promoteCatalogueDecoToGarden,
  promoteCatalogueMineralToGarden,
  promoteCataloguePlantToGarden,
} from "@/lib/promoteCatalogueToGarden";
import { cataloguePhotoFillStyle } from "@/lib/cataloguePhotoDisplay";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const UNIVERSES = [
  { id: "vegetal", label: "Végétal" },
  { id: "mineral", label: "Minéral" },
  { id: "deco", label: "Déco" },
  { id: "ambiances", label: "Ambiances" },
];

const AMBIANCE_TILE_COLORS = ["#A97F4E", "#5E7A62", "#86689A"];
const PLACEHOLDER_COLORS = ["#8C7AB0", "#7E8F6A", "#5F7BB0", "#A8925F"];

function hashColor(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
}

function normalizeSearch(q) {
  return String(q || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesSearch(nom, query) {
  if (!query) return true;
  const n = normalizeSearch(nom);
  const q = normalizeSearch(query);
  return n.includes(q);
}

function buildSubtitle(item, kind) {
  if (item.resume) return item.resume;
  if (kind === "vegetal" && item.exposition) {
    return `${String(item.exposition).replace("-", " ")} · ${item.floraison || "Facile"}`;
  }
  if (item.materiau) return [item.materiau, item.finition].filter(Boolean).join(" · ");
  return kind === "vegetal" ? "Plante" : kind === "mineral" ? "Minéral" : "Déco";
}

function UniversePill({ active, children, onClick }) {
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
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function HeartButton({ filled, disabled, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "none",
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {filled ? (
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
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            stroke="#4D554B"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function IdeeCard({ item, inGarden, toggling, onOpen, onToggleHeart }) {
  const photo = item.photo_url;
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: "1.5px solid #EEE9E0",
        display: "flex",
        flexDirection: "column",
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
        <HeartButton
          filled={inGarden}
          disabled={toggling}
          label={
            inGarden
              ? `Retirer ${item.nom} de vos coups de cœur`
              : `Ajouter ${item.nom} à vos coups de cœur`
          }
          onClick={() => onToggleHeart(item)}
        />
      </div>
      <button
        type="button"
        onClick={() => onOpen(item)}
        disabled={toggling}
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
        <span style={{ fontSize: 12, color: "#5B6359", lineHeight: 1.35 }}>{item.subtitle}</span>
      </button>
    </div>
  );
}

export default function IdeesScreen({
  t,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
  onOpenAmbiances,
  onOpenItemDetail,
}) {
  const [universe, setUniverse] = useState("vegetal");
  const [search, setSearch] = useState("");
  const [inGardenPlants, setInGardenPlants] = useState(() => new Set());
  const [inGardenMinerals, setInGardenMinerals] = useState(() => new Set());
  const [inGardenDeco, setInGardenDeco] = useState(() => new Set());
  const [itemIdsByPlant, setItemIdsByPlant] = useState(() => new Map());
  const [itemIdsByMineral, setItemIdsByMineral] = useState(() => new Map());
  const [itemIdsByDeco, setItemIdsByDeco] = useState(() => new Map());
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const refreshGarden = useCallback(async () => {
    try {
      const [plants, minerals, deco] = await Promise.all([
        loadCatalogueGardenState(),
        loadCatalogueMineralGardenState(),
        loadCatalogueDecoGardenState(),
      ]);
      setInGardenPlants(plants.inGarden);
      setItemIdsByPlant(plants.itemIdsByPlant);
      setInGardenMinerals(minerals.inGarden);
      setItemIdsByMineral(minerals.itemIdsByMineral);
      setInGardenDeco(deco.inGarden);
      setItemIdsByDeco(deco.itemIdsByDeco);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const ambianceTiles = useMemo(() => getActiveGardenIdeas().slice(0, 3), []);

  const gridItems = useMemo(() => {
    const q = search;
    if (universe === "vegetal") {
      return filterCataloguePlants({ populaireOnly: !q })
        .filter((p) => matchesSearch(p.nom, q))
        .map((p) => ({
          key: `v-${p.id}`,
          kind: "vegetal",
          id: p.id,
          nom: p.nom,
          photo_url: p.photo_url,
          subtitle: buildSubtitle(p, "vegetal"),
          raw: p,
        }));
    }
    if (universe === "mineral") {
      return filterCatalogueMinerals()
        .filter((m) => matchesSearch(m.nom, q))
        .map((m) => ({
          key: `m-${m.id}`,
          kind: "mineral",
          id: m.id,
          nom: m.nom,
          photo_url: m.photo_url,
          subtitle: buildSubtitle(m, "mineral"),
          raw: m,
        }));
    }
    if (universe === "deco") {
      return filterCatalogueDeco()
        .filter((d) => matchesSearch(d.nom, q))
        .map((d) => ({
          key: `d-${d.id}`,
          kind: "deco",
          id: d.id,
          nom: d.nom,
          photo_url: d.photo_url,
          subtitle: buildSubtitle(d, "deco"),
          raw: d,
        }));
    }
    return [];
  }, [universe, search]);

  const gridSectionTitle =
    universe === "mineral"
      ? "MINÉRAL"
      : universe === "deco"
        ? "DÉCO"
        : "PLANTES QUI ONT LA COTE";

  const isInGarden = (item) => {
    if (item.kind === "vegetal") return inGardenPlants.has(item.id);
    if (item.kind === "mineral") return inGardenMinerals.has(item.id);
    return inGardenDeco.has(item.id);
  };

  const discoveryFromItem = (item) => {
    if (item.kind === "vegetal") return plantToAnalysisResult(item.raw);
    if (item.kind === "mineral") return mineralToAnalysisResult(item.raw);
    return decoToAnalysisResult(item.raw);
  };

  const handleToggle = async (item) => {
    if (!item?.id || togglingId) return;
    setError(null);
    const alreadyIn = isInGarden(item);

    if (!alreadyIn && !canAddToGarden) {
      const promote =
        item.kind === "vegetal"
          ? () => promoteCataloguePlantToGarden(item.raw, t)
          : item.kind === "mineral"
            ? () => promoteCatalogueMineralToGarden(item.raw, t)
            : () => promoteCatalogueDecoToGarden(item.raw, t);
      onRequireAccount?.(promote);
      return;
    }

    setTogglingId(item.key);
    try {
      let result;
      if (item.kind === "vegetal") {
        result = alreadyIn
          ? await demoteCataloguePlantFromGarden(item.id, itemIdsByPlant)
          : await promoteCataloguePlantToGarden(item.raw, t);
      } else if (item.kind === "mineral") {
        result = alreadyIn
          ? await demoteCatalogueMineralFromGarden(item.id, itemIdsByMineral)
          : await promoteCatalogueMineralToGarden(item.raw, t);
      } else {
        result = alreadyIn
          ? await demoteCatalogueDecoFromGarden(item.id, itemIdsByDeco)
          : await promoteCatalogueDecoToGarden(item.raw, t);
      }
      if (!result.ok) setError(result.error || "unknown");
      else {
        await refreshGarden();
        onGardenChange?.();
      }
    } finally {
      setTogglingId(null);
    }
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
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1F2A22" }}>Idées</h1>
        <span style={{ fontSize: 14, color: "#5B6359" }}>
          Touchez le cœur pour l&apos;ajouter à votre dossier.
        </span>
      </div>

      <label
        htmlFor="idees-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          padding: "0 16px",
          borderRadius: 16,
          background: "#F2EEE7",
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="#5B6359" strokeWidth={2} />
          <path d="m21 21-4.3-4.3" stroke="#5B6359" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <input
          id="idees-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Olivier, haie, pergola…"
          aria-label="Rechercher une idée"
          style={{
            flexGrow: 1,
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 15,
            color: "#1F2A22",
            outline: "none",
            minWidth: 0,
          }}
        />
      </label>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {UNIVERSES.map((u) => (
          <UniversePill key={u.id} active={universe === u.id} onClick={() => setUniverse(u.id)}>
            {u.label}
          </UniversePill>
        ))}
      </div>

      {error ? <p style={{ margin: 0, fontSize: 13, color: COLORS.error }}>{String(error)}</p> : null}

      {(universe === "ambiances" || universe === "vegetal") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.2px",
              color: "#5B6359",
            }}
          >
            QUELLE AMBIANCE VOUS RESSEMBLE ?
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {ambianceTiles.map((idea, index) => (
              <button
                key={idea.id}
                type="button"
                onClick={onOpenAmbiances}
                style={{
                  height: 84,
                  borderRadius: 18,
                  background: AMBIANCE_TILE_COLORS[index] || "#5E7A62",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 10,
                  boxSizing: "border-box",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "left",
                }}
              >
                {idea.nom.replace(/^Jardin /i, "").replace(/^Cottage /i, "Cottage ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {universe !== "ambiances" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.2px",
              color: "#5B6359",
            }}
          >
            {gridSectionTitle}
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {gridItems.map((item) => (
              <IdeeCard
                key={item.key}
                item={item}
                inGarden={isInGarden(item)}
                toggling={togglingId === item.key}
                onOpen={(it) => onOpenItemDetail?.(discoveryFromItem(it))}
                onToggleHeart={handleToggle}
              />
            ))}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "#5B6359", lineHeight: 1.45 }}>
          Choisissez une ambiance ci-dessus pour parcourir les idées toutes faites, ou revenez sur
          Végétal, Minéral ou Déco.
        </p>
      )}
    </div>
  );
}
