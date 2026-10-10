/**
 * Catalogue unifié — sevya/6-catalogue.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogueIdeaCard from "@/components/catalogue/CatalogueIdeaCard";
import { AMENAGEMENT_CATEGORIES, filterCatalogueDeco } from "@/lib/catalogueDeco";
import { MINERAL_CATEGORIES, filterCatalogueMinerals } from "@/lib/catalogueMinerals";
import {
  CATALOGUE_CATEGORIES,
  filterCataloguePlants,
} from "@/lib/cataloguePlants";
import {
  buildAmenagementCardLine,
  buildCatalogueSubtitle,
  buildMineralCardLine,
  buildVegetalCardLine,
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

function subcategoryLabel(sub) {
  return sub;
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
  onOpenCataloguePlant,
  onOpenCatalogueItem,
}) {
  const [tab, setTab] = useState(initialTab);
  const [sub, setSub] = useState(initialFilters.categorie || initialFilters.famille || "Tous");
  const [envie, setEnvie] = useState(initialFilters.envie || initialFilters.envieTag || null);
  const [gardenState, setGardenState] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTab(initialTab);
    setSub(initialFilters.categorie || initialFilters.famille || "Tous");
    setEnvie(initialFilters.envie || initialFilters.envieTag || null);
  }, [
    initialTab,
    initialFilters.categorie,
    initialFilters.famille,
    initialFilters.envie,
    initialFilters.envieTag,
  ]);

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

  const subOptions = useMemo(() => {
    if (tab === "vegetal") return ["Tous", ...CATALOGUE_CATEGORIES];
    if (tab === "mineral") return ["Tous", ...MINERAL_CATEGORIES];
    return ["Tous", ...AMENAGEMENT_CATEGORIES];
  }, [tab]);

  const filteredItems = useMemo(() => {
    if (tab === "vegetal") {
      const categorie = sub === "Tous" ? null : sub;
      return filterCataloguePlants({ envie, categorie }).map((p) => ({
        key: `v-${p.id}`,
        universe: "vegetal",
        id: p.id,
        nom: p.nom,
        photo_url: p.photo_url,
        categorie: p.categorie,
        subtitle: buildVegetalCardLine(p),
        raw: p,
      }));
    }
    if (tab === "mineral") {
      const categorie = sub === "Tous" ? null : sub;
      return filterCatalogueMinerals({ categorie }).map((m) => ({
        key: `m-${m.id}`,
        universe: "mineral",
        id: m.id,
        nom: m.nom,
        photo_url: m.photo_url,
        categorie: m.categorie,
        subtitle: buildMineralCardLine(m),
        raw: m,
      }));
    }
    const categorie = sub === "Tous" ? null : sub;
    return filterCatalogueDeco({ categorie }).map((d) => ({
      key: `d-${d.id}`,
      universe: "deco",
      id: d.id,
      nom: d.nom,
      photo_url: d.photo_url,
      categorie: d.categorie,
      subtitle: buildAmenagementCardLine(d),
      raw: d,
    }));
  }, [tab, sub, envie, t]);

  const countLabel = `${filteredItems.length} idée${filteredItems.length > 1 ? "s" : ""}${
    sub !== "Tous" ? ` · ${subcategoryLabel(sub)}` : ""
  }${envie && tab === "vegetal" ? ` · ${envie}` : ""}`;

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setSub("Tous");
    if (nextTab !== "vegetal") setEnvie(null);
  };

  const openItem = (item) => {
    if (item.universe === "vegetal" && onOpenCataloguePlant) {
      onOpenCataloguePlant(item.id, "catalogue");
      return;
    }
    if ((item.universe === "mineral" || item.universe === "deco") && onOpenCatalogueItem) {
      onOpenCatalogueItem(item.universe, item.id, "catalogue");
      return;
    }
    onOpenItemDetail?.(discoveryFromCatalogueItem(item));
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

  const tabStyle = (active) =>
    active
      ? {
          minHeight: 44,
          border: "none",
          borderRadius: 12,
          background: "#FFFFFF",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 700,
          color: "#1F2A22",
          boxShadow: "0 1px 3px rgba(31,42,34,0.12)",
          cursor: "pointer",
        }
      : {
          minHeight: 44,
          border: "none",
          borderRadius: 12,
          background: "transparent",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          color: "#5B6359",
          cursor: "pointer",
        };

  const subStyle = (active) =>
    active
      ? {
          flexShrink: 0,
          minHeight: 38,
          padding: "0 14px",
          borderRadius: 999,
          border: "none",
          background: "#1F2A22",
          color: "#FFFFFF",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          cursor: "pointer",
        }
      : {
          flexShrink: 0,
          minHeight: 38,
          padding: "0 14px",
          borderRadius: 999,
          border: "1.5px solid #E4DED3",
          background: "#FFFFFF",
          color: "#4D554B",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          cursor: "pointer",
        };

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "16px 18px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          borderBottom: "1.5px solid #F2EEE7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour aux idées"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "#F2EEE7",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m15 18-6-6 6-6" stroke="#1F2A22" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F2A22" }}>Le catalogue</h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 4,
            padding: 4,
            borderRadius: 16,
            background: "#F2EEE7",
          }}
        >
          {TABS.map((row) => (
            <button
              key={row.id}
              type="button"
              aria-pressed={tab === row.id}
              onClick={() => handleTabChange(row.id)}
              style={tabStyle(tab === row.id)}
            >
              {row.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            marginRight: -18,
            paddingRight: 18,
            scrollbarWidth: "none",
          }}
        >
          {subOptions.map((label) => {
            const value = label === "Tous" ? "Tous" : label;
            const display = label;
            return (
              <button
                key={`${tab}-${label}`}
                type="button"
                aria-pressed={sub === value}
                onClick={() => setSub(value)}
                style={subStyle(sub === value)}
              >
                {display}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "14px 18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6359" }}>{countLabel}</span>

        {error ? <p style={{ margin: 0, fontSize: 13, color: COLORS.error }}>{String(error)}</p> : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {filteredItems.map((item) => (
            <CatalogueIdeaCard
              key={item.key}
              nom={item.nom}
              subtitle={item.subtitle}
              photo_url={item.photo_url}
              categorie={item.categorie}
              catalogUniverse={item.universe}
              inGarden={inGarden(item)}
              toggling={togglingKey === item.key}
              onOpen={() => openItem(item)}
              onToggleHeart={() => handleToggle(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
