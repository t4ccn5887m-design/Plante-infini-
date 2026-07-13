/**
 * Catalogue — onglets Végétal + Minéral & déco (Option C mock).
 * Maquettes : wilder_ecran_catalogue.html, wilder_ecran_catalogue_mineral.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATALOGUE_ENVIE_TAGS,
  CATALOGUE_FAMILLES,
  countByFamille,
  filterCataloguePlants,
} from "@/lib/cataloguePlants";
import {
  MINERAL_AMBIANCE_TAGS,
  MINERAL_FAMILLES,
  countMineralsByFamille,
  filterCatalogueMinerals,
} from "@/lib/catalogueMinerals";
import {
  demoteCatalogueMineralFromGarden,
  demoteCataloguePlantFromGarden,
  loadCatalogueGardenState,
  loadCatalogueMineralGardenState,
  promoteCatalogueMineralToGarden,
  promoteCataloguePlantToGarden,
} from "@/lib/promoteCatalogueToGarden";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconStone({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polygon points="6 3 18 3 21 9 12 21 3 9" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function IconLeaf({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FamilleIcon({ famille }) {
  if (famille === "coniferes") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <polygon points="12 3 7 11 17 11" />
        <polygon points="12 8 6 18 18 18" />
        <line x1="12" y1="18" x2="12" y2="21" />
      </svg>
    );
  }
  if (famille === "arbres") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="9" r="6" />
        <line x1="12" y1="15" x2="12" y2="21" />
      </svg>
    );
  }
  if (famille === "rosiers") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 9c0-3 2-4 2-4s0 3-2 4z" />
        <path d="M12 15c0 3-2 4-2 4s0-3 2-4z" />
        <path d="M9 12c-3 0-4-2-4-2s3 0 4 2z" />
        <path d="M15 12c3 0 4 2 4 2s-3 0-4-2z" />
      </svg>
    );
  }
  if (famille === "fleurs" || famille === "vivaces") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="6" r="2.1" />
        <circle cx="12" cy="18" r="2.1" />
        <circle cx="6" cy="12" r="2.1" />
        <circle cx="18" cy="12" r="2.1" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  return <IconLeaf size={21} />;
}

function PlantRow({ plant, inGarden, toggling, onToggle, t }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 13,
        padding: "8px 10px 8px 8px",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: COLORS.greenTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: COLORS.greenInk,
          overflow: "hidden",
        }}
      >
        {plant.photo_url ? (
          <img src={plant.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <IconLeaf />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {plant.nom}
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.muted,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {plant.resume}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(plant)}
        disabled={toggling}
        style={{
          flex: "none",
          height: 33,
          padding: "0 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          cursor: toggling ? "wait" : "pointer",
          fontFamily: "inherit",
          border: inGarden ? "none" : `0.5px solid ${COLORS.borderStrong}`,
          background: inGarden ? COLORS.greenTint : "#fff",
          color: inGarden ? COLORS.greenInk : COLORS.ink,
          opacity: toggling ? 0.65 : 1,
        }}
      >
        {inGarden ? (
          <>
            <IconCheck /> {t("catalogue.in_garden")}
          </>
        ) : (
          <>
            <IconPlus /> {t("catalogue.add_to_garden")}
          </>
        )}
      </button>
    </div>
  );
}

function MineralFamilleIcon({ famille }) {
  if (famille === "paillage_sols") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M3 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        <path d="M3 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        <circle cx="7" cy="8" r="1" />
        <circle cx="13" cy="7" r="1" />
        <circle cx="17" cy="9" r="1" />
      </svg>
    );
  }
  if (famille === "pierres_rochers") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M5 15l3-7 5 2 3-4 3 6-2 6H4z" />
      </svg>
    );
  }
  if (famille === "bordures") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="13" y1="10" x2="13" y2="14" />
      </svg>
    );
  }
  if (famille === "pas_allees") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="8" width="6" height="6" rx="1" />
        <rect x="7" y="15" width="6" height="6" rx="1" />
      </svg>
    );
  }
  if (famille === "deco_mobilier") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M12 3c2 3 2 5 0 7s-2 4 0 6" />
        <path d="M8 21h8" />
        <path d="M10 21c0-3 4-3 4 0" />
      </svg>
    );
  }
  if (famille === "clotures_bois") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <line x1="4" y1="3" x2="4" y2="21" />
        <line x1="10" y1="3" x2="10" y2="21" />
        <line x1="16" y1="3" x2="16" y2="21" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="2" y1="15" x2="22" y2="15" />
      </svg>
    );
  }
  return <IconStone size={20} />;
}

function MineralRow({ article, inGarden, toggling, onToggle, t }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 13,
        padding: "8px 10px 8px 8px",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: COLORS.stoneTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: COLORS.stoneInk,
          overflow: "hidden",
        }}
      >
        {article.photo_url ? (
          <img src={article.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <IconStone />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {article.nom}
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.muted,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {article.resume}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(article)}
        disabled={toggling}
        style={{
          flex: "none",
          height: 33,
          padding: "0 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          cursor: toggling ? "wait" : "pointer",
          fontFamily: "inherit",
          border: inGarden ? "none" : `0.5px solid ${COLORS.borderStrong}`,
          background: inGarden ? COLORS.stoneTint : "#fff",
          color: inGarden ? COLORS.stoneInk : COLORS.ink,
          opacity: toggling ? 0.65 : 1,
        }}
      >
        {inGarden ? (
          <>
            <IconCheck /> {t("catalogue.in_garden")}
          </>
        ) : (
          <>
            <IconPlus /> {t("catalogue.add_to_garden")}
          </>
        )}
      </button>
    </div>
  );
}

export default function CataloguePepiniereScreen({
  t,
  canAddToGarden = true,
  onGardenChange,
}) {
  const [activeTab, setActiveTab] = useState("vegetal");
  const [envieTag, setEnvieTag] = useState(null);
  const [famille, setFamille] = useState(null);
  const [ambianceTag, setAmbianceTag] = useState(null);
  const [mineralFamille, setMineralFamille] = useState(null);
  const [inGarden, setInGarden] = useState(() => new Set());
  const [itemIdsByPlant, setItemIdsByPlant] = useState(() => new Map());
  const [inGardenMinerals, setInGardenMinerals] = useState(() => new Set());
  const [itemIdsByMineral, setItemIdsByMineral] = useState(() => new Map());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const familleCounts = useMemo(() => countByFamille(), []);
  const mineralFamilleCounts = useMemo(() => countMineralsByFamille(), []);

  const popularPlants = useMemo(
    () =>
      filterCataloguePlants({
        envieTag,
        famille,
        populaireOnly: true,
      }),
    [envieTag, famille]
  );

  const popularMinerals = useMemo(
    () =>
      filterCatalogueMinerals({
        ambianceTag,
        famille: mineralFamille,
        populaireOnly: true,
      }),
    [ambianceTag, mineralFamille]
  );

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    try {
      const [plantState, mineralState] = await Promise.all([
        loadCatalogueGardenState(),
        loadCatalogueMineralGardenState(),
      ]);
      setInGarden(plantState.inGarden);
      setItemIdsByPlant(plantState.itemIdsByPlant);
      setInGardenMinerals(mineralState.inGarden);
      setItemIdsByMineral(mineralState.itemIdsByMineral);
    } catch {
      setInGarden(new Set());
      setItemIdsByPlant(new Map());
      setInGardenMinerals(new Set());
      setItemIdsByMineral(new Map());
    }
    setGardenLoading(false);
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(null);
    setEnvieTag(null);
    setFamille(null);
    setAmbianceTag(null);
    setMineralFamille(null);
  };

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const handleToggleEnvie = (tag) => {
    setEnvieTag((current) => (current === tag ? null : tag));
  };

  const handleToggleFamille = (key) => {
    setFamille((current) => (current === key ? null : key));
  };

  const handleTogglePlant = async (plant) => {
    if (!plant?.id || togglingId) return;
    setError(null);

    const alreadyIn = inGarden.has(plant.id);

    if (!alreadyIn && !canAddToGarden) {
      setError(t("mes_scans.garden_gate"));
      return;
    }

    setTogglingId(plant.id);
    try {
      if (alreadyIn) {
        const result = await demoteCataloguePlantFromGarden(plant.id, itemIdsByPlant);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      } else {
        const result = await promoteCataloguePlantToGarden(plant, t);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleMineral = async (article) => {
    if (!article?.id || togglingId) return;
    setError(null);

    const alreadyIn = inGardenMinerals.has(article.id);

    if (!alreadyIn && !canAddToGarden) {
      setError(t("mes_scans.garden_gate"));
      return;
    }

    setTogglingId(article.id);
    try {
      if (alreadyIn) {
        const result = await demoteCatalogueMineralFromGarden(article.id, itemIdsByMineral);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      } else {
        const result = await promoteCatalogueMineralToGarden(article, t);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
        <div style={{ padding: "15px 16px 10px" }}>
          <span style={{ fontSize: 14, color: COLORS.muted }}>{t("catalogue.menu_crumb")}</span>
        </div>

        <div style={{ padding: "2px 16px 14px" }}>
          <h1
            className="wilder-v2-title-page"
            style={{ margin: 0, fontSize: 21, letterSpacing: "-0.01em", lineHeight: 1.15 }}
          >
            {t("catalogue.title")}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
            {t("catalogue.subtitle")}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 0,
            margin: "0 16px 14px",
            border: `0.5px solid ${COLORS.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => switchTab("vegetal")}
            style={{
              flex: 1,
              height: 38,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              background: activeTab === "vegetal" ? COLORS.greenTint : "#fff",
              color: activeTab === "vegetal" ? COLORS.greenInk : COLORS.muted,
            }}
          >
            {t("catalogue.tab_vegetal")}
          </button>
          <button
            type="button"
            onClick={() => switchTab("mineral")}
            style={{
              flex: 1,
              height: 38,
              border: "none",
              borderLeft: `0.5px solid ${COLORS.border}`,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              background: activeTab === "mineral" ? COLORS.stoneTint : "#fff",
              color: activeTab === "mineral" ? COLORS.stoneInk : COLORS.muted,
            }}
          >
            {t("catalogue.tab_mineral")}
          </button>
        </div>

        {activeTab === "mineral" ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 7,
                overflowX: "auto",
                padding: "0 16px 16px",
                scrollbarWidth: "none",
              }}
            >
              {MINERAL_AMBIANCE_TAGS.map((tag) => {
                const active = ambianceTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAmbianceTag((current) => (current === tag ? null : tag))}
                    style={{
                      flex: "none",
                      height: 32,
                      padding: "0 13px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      border: active ? "none" : `0.5px solid ${COLORS.borderStrong}`,
                      background: active ? COLORS.purpleTint : "#fff",
                      color: active ? COLORS.purpleInk : COLORS.secondary,
                    }}
                  >
                    {t(`catalogue.ambiance_${tag}`)}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "0 16px",
                marginBottom: 9,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.secondary,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {t("catalogue.section_familles")}
            </div>

            <div
              style={{
                padding: "0 16px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {MINERAL_FAMILLES.map((key) => {
                const active = mineralFamille === key;
                const count = mineralFamilleCounts[key] || 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMineralFamille((current) => (current === key ? null : key))}
                    style={{
                      border: `0.5px solid ${active ? COLORS.stoneInk : COLORS.border}`,
                      borderRadius: 13,
                      padding: "13px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      background: active ? COLORS.stoneTint : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: COLORS.stoneTint,
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COLORS.stoneInk,
                      }}
                    >
                      <MineralFamilleIcon famille={key} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>
                        {t(`catalogue.mineral_famille_${key}`)}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                        {t("catalogue.references_count", { count })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "0 16px",
                marginBottom: 9,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.secondary,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {t("catalogue.section_popular")}
            </div>

            <div style={{ padding: "0 16px 6px", display: "flex", flexDirection: "column", gap: 9 }}>
              {popularMinerals.length === 0 ? (
                <p style={{ fontSize: 12.5, color: COLORS.muted, padding: "8px 0 12px" }}>
                  {t("catalogue.no_results")}
                </p>
              ) : (
                popularMinerals.map((article) => (
                  <MineralRow
                    key={article.id}
                    article={article}
                    inGarden={inGardenMinerals.has(article.id)}
                    toggling={togglingId === article.id || gardenLoading}
                    onToggle={handleToggleMineral}
                    t={t}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 7,
                overflowX: "auto",
                padding: "0 16px 16px",
                scrollbarWidth: "none",
              }}
            >
              {CATALOGUE_ENVIE_TAGS.map((tag) => {
                const active = envieTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleEnvie(tag)}
                    style={{
                      flex: "none",
                      height: 32,
                      padding: "0 13px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      border: active ? "none" : `0.5px solid ${COLORS.borderStrong}`,
                      background: active ? COLORS.purpleTint : "#fff",
                      color: active ? COLORS.purpleInk : COLORS.secondary,
                    }}
                  >
                    {t(`catalogue.envie_${tag}`)}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "0 16px",
                marginBottom: 9,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.secondary,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {t("catalogue.section_familles")}
            </div>

            <div
              style={{
                padding: "0 16px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {CATALOGUE_FAMILLES.map((key) => {
                const active = famille === key;
                const count = familleCounts[key] || 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleFamille(key)}
                    style={{
                      border: `0.5px solid ${active ? COLORS.greenInk : COLORS.border}`,
                      borderRadius: 13,
                      padding: "13px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      background: active ? COLORS.greenTint : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: COLORS.greenTint,
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COLORS.greenInk,
                      }}
                    >
                      <FamilleIcon famille={key} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>
                        {t(`catalogue.famille_${key}`)}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                        {t("catalogue.varieties_count", { count })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "0 16px",
                marginBottom: 9,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.secondary,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {t("catalogue.section_popular")}
            </div>

            <div style={{ padding: "0 16px 6px", display: "flex", flexDirection: "column", gap: 9 }}>
              {popularPlants.length === 0 ? (
                <p style={{ fontSize: 12.5, color: COLORS.muted, padding: "8px 0 12px" }}>
                  {t("catalogue.no_results")}
                </p>
              ) : (
                popularPlants.map((plant) => (
                  <PlantRow
                    key={plant.id}
                    plant={plant}
                    inGarden={inGarden.has(plant.id)}
                    toggling={togglingId === plant.id || gardenLoading}
                    onToggle={handleTogglePlant}
                    t={t}
                  />
                ))
              )}
            </div>
          </>
        )}

        {error && (
          <p style={{ margin: "12px 16px 0", fontSize: 12, color: COLORS.heart, lineHeight: 1.4 }}>{error}</p>
        )}

        <div style={{ padding: "14px 16px 20px" }} />
    </>
  );
}
