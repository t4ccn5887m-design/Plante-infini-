/**
 * Catalogue unifié — sevya/6-catalogue.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogueIdeaCard from "@/components/catalogue/CatalogueIdeaCard";
import { CATALOGUE_FAMILLES, filterCataloguePlants } from "@/lib/cataloguePlants";
import { DECO_FAMILLES, filterCatalogueDeco } from "@/lib/catalogueDeco";
import { MINERAL_FAMILLES, filterCatalogueMinerals } from "@/lib/catalogueMinerals";
import {
  buildCatalogueSubtitle,
  discoveryFromCatalogueItem,
} from "@/lib/catalogueIdeesHelpers";
import {
  isCatalogueItemInGarden,
  loadAllCatalogueGardenState,
  toggleCatalogueItemInGarden,
} from "@/lib/catalogueGardenToggle";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const TABS = [
  { id: "vegetal", label: "Végétal" },
  { id: "mineral", label: "Minéral" },
  { id: "deco", label: "Aménagements" },
];

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 0",
        minHeight: 40,
        borderRadius: 12,
        border: "none",
        background: active ? "#1F2A22" : "transparent",
        color: active ? "#FFFFFF" : "#5B6359",
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

function FamillePill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 34,
        padding: "0 13px",
        borderRadius: 999,
        border: active ? "none" : "1.5px solid #E4DED3",
        background: active ? "#E6F0E3" : "#FFFFFF",
        color: active ? "#2F5E3F" : "#4D554B",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: active ? 700 : 600,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function familleLabel(tab, familleId, t) {
  if (tab === "vegetal") return t(`catalogue.famille_${familleId}`);
  if (tab === "mineral") return t(`catalogue.mineral_famille_${familleId}`);
  return t(`catalogue.deco_famille_${familleId}`);
}

export default function CatalogueHubScreen({
  t,
  initialTab = "vegetal",
  initialFilters = {},
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
  onOpenItemDetail,
}) {
  const [tab, setTab] = useState(initialTab);
  const [famille, setFamille] = useState(initialFilters.famille ?? null);
  const [envieTag, setEnvieTag] = useState(initialFilters.envieTag ?? null);
  const [exposition, setExposition] = useState(initialFilters.exposition ?? null);
  const [gardenState, setGardenState] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTab(initialTab);
    setFamille(initialFilters.famille ?? null);
    setEnvieTag(initialFilters.envieTag ?? null);
    setExposition(initialFilters.exposition ?? null);
  }, [initialTab, initialFilters.famille, initialFilters.envieTag, initialFilters.exposition]);

  const refreshGarden = useCallback(async () => {
    try {
      setGardenState(await loadAllCatalogueGardenState());
    } catch {
      setGardenState(null);
    }
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const familleIds = useMemo(() => {
    if (tab === "vegetal") return CATALOGUE_FAMILLES;
    if (tab === "mineral") return MINERAL_FAMILLES;
    return DECO_FAMILLES;
  }, [tab]);

  const filteredItems = useMemo(() => {
    if (tab === "vegetal") {
      let list = filterCataloguePlants({ envieTag: envieTag || null, famille: famille || null });
      if (exposition) list = list.filter((p) => p.exposition === exposition);
      return list.map((p) => ({
        key: `v-${p.id}`,
        universe: "vegetal",
        id: p.id,
        nom: p.nom,
        photo_url: p.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "vegetal", raw: p }, t),
        raw: p,
      }));
    }
    if (tab === "mineral") {
      return filterCatalogueMinerals({ famille: famille || null }).map((m) => ({
        key: `m-${m.id}`,
        universe: "mineral",
        id: m.id,
        nom: m.nom,
        photo_url: m.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "mineral", raw: m }, t),
        raw: m,
      }));
    }
    return filterCatalogueDeco({ famille: famille || null }).map((d) => ({
      key: `d-${d.id}`,
      universe: "deco",
      id: d.id,
      nom: d.nom,
      photo_url: d.photo_url,
      subtitle: buildCatalogueSubtitle({ kind: "deco", raw: d }, t),
      raw: d,
    }));
  }, [tab, famille, envieTag, exposition, t]);

  const countLabel = `${filteredItems.length} idée${filteredItems.length > 1 ? "s" : ""}`;

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setFamille(null);
    if (nextTab !== "vegetal") {
      setEnvieTag(null);
      setExposition(null);
    }
  };

  const handleToggle = async (item) => {
    if (!item?.id || !gardenState || togglingKey) return;
    setError(null);
    setTogglingKey(item.key);
    try {
      const result = await toggleCatalogueItemInGarden({
        universe: item.universe,
        raw: item.raw,
        id: item.id,
        t,
        state: gardenState,
        canAddToGarden,
        onRequireAccount,
      });
      if (result.gated) return;
      if (!result.ok) setError(result.error || "unknown");
      else {
        await refreshGarden();
        onGardenChange?.();
      }
    } finally {
      setTogglingKey(null);
    }
  };

  const inGarden = (item) =>
    gardenState ? isCatalogueItemInGarden(item.universe, item.id, gardenState) : false;

  const filterHint =
    tab === "vegetal" && (envieTag || exposition)
      ? envieTag
        ? t(`catalogue.envie_${envieTag}`)
        : exposition
      : null;

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "1.5px solid #EEE9E0",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5" stroke="#1F2A22" strokeWidth={2} strokeLinecap="round" />
            <path d="m12 19-7-7 7-7" stroke="#1F2A22" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F2A22" }}>Catalogue</h1>
          {filterHint ? (
            <span style={{ fontSize: 13, color: "#5B6359" }}>Filtre : {filterHint}</span>
          ) : null}
        </div>
      </div>

      <div
        style={{
          margin: "0 18px",
          padding: 4,
          borderRadius: 14,
          background: "#F2EEE7",
          display: "flex",
          gap: 4,
        }}
      >
        {TABS.map((row) => (
          <TabButton key={row.id} active={tab === row.id} onClick={() => handleTabChange(row.id)}>
            {row.label}
          </TabButton>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "0 18px",
          scrollbarWidth: "none",
        }}
      >
        <FamillePill active={!famille} onClick={() => setFamille(null)}>
          Tous
        </FamillePill>
        {familleIds.map((fid) => (
          <FamillePill key={fid} active={famille === fid} onClick={() => setFamille(fid)}>
            {familleLabel(tab, fid, t)}
          </FamillePill>
        ))}
      </div>

      <div style={{ padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2F5E3F" }}>{countLabel}</span>
      </div>

      {error ? (
        <p style={{ margin: 0, padding: "0 18px", fontSize: 13, color: COLORS.error }}>{String(error)}</p>
      ) : null}

      <div
        style={{
          padding: "0 18px 8px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {filteredItems.map((item) => (
          <CatalogueIdeaCard
            key={item.key}
            nom={item.nom}
            subtitle={item.subtitle}
            photo_url={item.photo_url}
            inGarden={inGarden(item)}
            toggling={togglingKey === item.key}
            onOpen={() => onOpenItemDetail?.(discoveryFromCatalogueItem(item))}
            onToggleHeart={() => handleToggle(item)}
          />
        ))}
      </div>
    </div>
  );
}
