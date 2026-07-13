/**
 * Accueil Wilder — maquette wilder_accueil_final.html
 * États : jardin vide (hall) / jardin rempli (résumé + aperçu).
 * Onglet « Mon jardin » = vue détaillée (zones, mot paysagiste).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadGardenIntention, saveGardenIntention } from "@/lib/gardenIntention";
import { fetchPalettes, fetchPaletteItems, fetchZones } from "@/lib/paletteStorage";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function expositionLabel(t, value) {
  if (!value) return null;
  return t(`palette.zone.exposition_${String(value).replace("-", "_")}`);
}

function elementsCountLabel(n) {
  return n <= 1 ? `${n} élément` : `${n} éléments`;
}

function favorisCountLabel(n) {
  if (n <= 0) return null;
  if (n <= 1) return `${n} coup de cœur`;
  return `${n} coups de cœur`;
}

function IconLeaf({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4" y1="4" x2="6" y2="6" />
      <line x1="18" y1="18" x2="20" y2="20" />
    </svg>
  );
}

function IconHeart({ size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ fill: "currentColor", stroke: "none" }}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconCamera({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconStone({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M5 15l3-7 5 2 3-4 3 6-2 6H4z" />
    </svg>
  );
}

function IconDeco({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M12 3c2 3 2 5 0 7s-2 4 0 6" />
      <path d="M8 21h8" />
      <path d="M10 21c0-3 4-3 4 0" />
    </svg>
  );
}

function itemKindStyle(item) {
  const isDeco =
    item.kind === "deco" || item.type === "deco" || Boolean(item.catalogue_deco_id);
  const isMineral =
    !isDeco &&
    (item.kind === "mineral" ||
      item.type === "mineral" ||
      Boolean(item.catalogue_mineral_id));

  if (isDeco) {
    return { tint: COLORS.decoTint, ink: COLORS.decoInk, isDeco: true, isMineral: false };
  }
  if (isMineral) {
    return { tint: COLORS.stoneTint, ink: COLORS.stoneInk, isDeco: false, isMineral: true };
  }
  return { tint: COLORS.greenTint, ink: COLORS.greenInk, isDeco: false, isMineral: false };
}

function IconAmbiance({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function DoorCard({ hallKey, icon, title, desc, onClick }) {
  const { tint: bg, ink: fg } = COLORS.hall[hallKey];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 12,
        background: bg,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: fg,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="wilder-v2-title-feature" style={{ fontSize: 13.5, color: COLORS.ink }}>
          {title}
        </div>
        <div style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ marginLeft: "auto", color: COLORS.muted, fontSize: 18, lineHeight: 1 }}>›</span>
    </button>
  );
}

function PreviewCard({ item }) {
  const { tint, ink, isDeco, isMineral } = itemKindStyle(item);

  return (
    <div
      style={{
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 11,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 58,
          background: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ink,
          position: "relative",
        }}
      >
        {item.photo ? (
          <img src={item.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : isDeco ? (
          <IconDeco size={19} />
        ) : isMineral ? (
          <IconStone />
        ) : (
          <IconLeaf size={19} />
        )}
        {item.favori && (
          <span
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.heart,
            }}
          >
            <IconHeart />
          </span>
        )}
      </div>
      <div style={{ padding: "6px 8px 8px" }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: COLORS.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.nom}
        </div>
      </div>
    </div>
  );
}

function PlantCard({ plante, t }) {
  const { tint, ink, isDeco, isMineral } = itemKindStyle(plante);
  const expo = !isMineral && !isDeco ? expositionLabel(t, plante.exposition) : null;
  const materialLine =
    (isMineral || isDeco) &&
    (plante.resume || [plante.materiau, plante.finition].filter(Boolean).join(" · "));

  return (
    <div style={{ border: `0.5px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div
        style={{
          height: 78,
          background: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ink,
          position: "relative",
        }}
      >
        {plante.photo ? (
          <img
            src={plante.photo}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : isDeco ? (
          <IconDeco size={26} />
        ) : isMineral ? (
          <IconStone size={26} />
        ) : (
          <IconLeaf />
        )}
        {plante.favori && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.heart,
            }}
          >
            <IconHeart size={13} />
          </span>
        )}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>
          {plante.nom}
        </div>
        {expo && (
          <div
            style={{
              fontSize: 11,
              color: COLORS.muted,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconSun /> {expo}
          </div>
        )}
        {materialLine && (
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, lineHeight: 1.35 }}>
            {materialLine}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonJardinScreen({
  t,
  onNavigateCatalogue,
  onNavigateIdeesJardins,
  onScan,
  onOpenBrief,
  gardenRefreshTick = 0,
  homeTab = "accueil",
}) {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [totalPlants, setTotalPlants] = useState(0);
  const [totalFavoris, setTotalFavoris] = useState(0);
  const [gardenIntention, setGardenIntention] = useState("");

  const loadGarden = useCallback(async () => {
    setLoading(true);

    const palettesRes = await fetchPalettes();
    if (!palettesRes.ok || !palettesRes.data?.length) {
      setZones([]);
      setAllItems([]);
      setTotalPlants(0);
      setTotalFavoris(0);
      setLoading(false);
      return;
    }

    const paletteId = palettesRes.data[0].id;
    const [zonesRes, itemsRes] = await Promise.all([
      fetchZones(paletteId),
      fetchPaletteItems(paletteId),
    ]);

    const items = itemsRes.ok ? itemsRes.data : [];
    const zoneList = zonesRes.ok ? zonesRes.data : [];

    const grouped = zoneList
      .map((zone) => {
        const plants = items
          .filter((item) => item.zone_id === zone.id)
          .map((item) => ({
            id: item.id,
            nom: item.discovery?.nom || "Plante",
            kind: item.discovery?.kind,
            type: item.discovery?.type,
            catalogue_mineral_id: item.discovery?.catalogue_mineral_id,
            catalogue_deco_id: item.discovery?.catalogue_deco_id,
            materiau: item.discovery?.materiau,
            finition: item.discovery?.finition,
            resume: item.discovery?.resume,
            exposition: zone.exposition,
            photo: item.discovery?.photo || item.discovery?.cloudImageUrl || null,
            favori: Boolean(item.discovery?.favori),
          }));
        return { id: zone.id, nom: zone.nom, plants };
      })
      .filter((zone) => zone.plants.length > 0);

    const flat = grouped
      .flatMap((z) => z.plants)
      .sort((a, b) => {
        if (a.favori !== b.favori) return a.favori ? -1 : 1;
        return a.nom.localeCompare(b.nom, "fr");
      });

    const plantCount = flat.length;
    const favCount = flat.filter((p) => p.favori).length;

    setZones(grouped);
    setAllItems(flat);
    setTotalPlants(plantCount);
    setTotalFavoris(favCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    setGardenIntention(loadGardenIntention());
  }, []);

  useEffect(() => {
    loadGarden();
  }, [loadGarden, gardenRefreshTick]);

  const handleIntentionChange = (event) => {
    const value = event.target.value;
    setGardenIntention(value);
    saveGardenIntention(value);
  };

  const isEmpty = !loading && totalPlants === 0;
  const previewItems = useMemo(() => allItems.slice(0, 3), [allItems]);

  const filledSubtitle = useMemo(() => {
    const parts = [elementsCountLabel(totalPlants)];
    const fav = favorisCountLabel(totalFavoris);
    if (fav) parts.push(fav);
    parts.push("brief prêt");
    return parts.join(" · ");
  }, [totalPlants, totalFavoris]);

  return (
    <>
          {homeTab === "accueil" && (
            <>
              {isEmpty && !loading && (
                <>
                  <div
                    className="wilder-v2-hero wilder-v2-hero--tall"
                    style={{
                      height: 190,
                      position: "relative",
                      background: COLORS.heroGradient,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: 16,
                      flex: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.35))",
                      }}
                      aria-hidden="true"
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div
                        className="wilder-v2-title-hero"
                        style={{
                          fontSize: 21,
                          color: "#fff",
                          lineHeight: 1.2,
                        }}
                      >
                        Composez le jardin
                        <br />
                        qui vous ressemble
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#ffffffdd",
                          marginTop: 6,
                          lineHeight: 1.45,
                        }}
                      >
                        Rassemblez ce que vous aimez, on en fait un brief pour votre paysagiste.
                      </div>
                    </div>
                  </div>

                  <div
                    className="wilder-v2-title-section"
                    style={{
                      padding: "15px 15px 7px",
                      fontSize: 11.5,
                      color: COLORS.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Par où commencer&nbsp;?
                  </div>

                  <div
                    style={{
                      padding: "0 15px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 9,
                    }}
                  >
                    <DoorCard
                      hallKey="scanner"
                      icon={<IconCamera size={21} />}
                      title="Scanner une plante"
                      desc="J'ai vu un truc joli dehors"
                      onClick={onScan}
                    />
                    <DoorCard
                      hallKey="catalogue"
                      icon={<IconLeaf size={21} />}
                      title="Parcourir le catalogue"
                      desc="Plantes, minéral & idées"
                      onClick={onNavigateCatalogue}
                    />
                    <DoorCard
                      hallKey="ambiance"
                      icon={<IconAmbiance />}
                      title="Piocher une ambiance"
                      desc="Méditerranéen, japonais…"
                      onClick={onNavigateIdeesJardins}
                    />
                  </div>
                </>
              )}

              {loading && (
                <div style={{ padding: 24, fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
                  Chargement…
                </div>
              )}

              {!isEmpty && !loading && (
                <>
                  <div
                    className="wilder-v2-hero wilder-v2-hero--short"
                    style={{
                      height: 140,
                      position: "relative",
                      background: COLORS.heroGradientShort,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: 15,
                      flex: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.35))",
                      }}
                      aria-hidden="true"
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div className="wilder-v2-title-hero" style={{ fontSize: 18, color: "#fff" }}>
                        Votre jardin prend forme 🌿
                      </div>
                      <div style={{ fontSize: 11.5, color: "#ffffffdd", marginTop: 4 }}>
                        {filledSubtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "13px 15px 9px", display: "flex", gap: 9 }}>
                    <button
                      type="button"
                      onClick={onOpenBrief}
                      style={{
                        flex: 1,
                        background: COLORS.active,
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: 11,
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: "center",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Voir mon brief
                    </button>
                    <button
                      type="button"
                      onClick={onNavigateCatalogue}
                      style={{
                        flex: 1,
                        border: `0.5px solid ${COLORS.borderStrong}`,
                        borderRadius: 12,
                        padding: 11,
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: "center",
                        background: "#fff",
                        color: COLORS.ink,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      + Ajouter
                    </button>
                  </div>

                  <div
                    className="wilder-v2-title-section"
                    style={{
                      padding: "2px 15px 7px",
                      fontSize: 11,
                      color: COLORS.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Aperçu de mon jardin
                  </div>

                  <div
                    style={{
                      padding: "0 15px 16px",
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    {previewItems.map((item) => (
                      <PreviewCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {homeTab === "jardin" && (
            <div style={{ padding: "16px 0 8px" }}>
              <div style={{ padding: "0 16px 14px" }}>
                <div className="wilder-v2-title-page" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>
                  Mon jardin
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                  {loading
                    ? "…"
                    : `${elementsCountLabel(totalPlants)}${
                        totalFavoris > 0 ? ` · ${favorisCountLabel(totalFavoris)}` : ""
                      }`}
                </div>
              </div>

              {loading && (
                <div style={{ padding: "8px 16px 24px", fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
                  Chargement…
                </div>
              )}

              {isEmpty && !loading && (
                <div style={{ padding: "8px 16px 24px", textAlign: "center" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      margin: "8px auto 12px",
                      borderRadius: "50%",
                      background: COLORS.greenTint,
                      color: COLORS.greenInk,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconLeaf size={28} />
                  </div>
                  <div className="wilder-v2-title-section" style={{ fontSize: 15, color: COLORS.ink }}>
                    Ton projet est encore vide
                  </div>
                  <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.55, marginTop: 6 }}>
                    Scanne une plante ou parcours le catalogue pour commencer.
                  </div>
                </div>
              )}

              {!loading &&
                zones.map((zone) => (
                  <div key={zone.id}>
                    <div
                      style={{
                        padding: "0 16px",
                        marginBottom: 9,
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <span className="wilder-v2-title-feature" style={{ fontSize: 14, color: COLORS.ink }}>
                        {zone.nom}
                      </span>
                      <span style={{ fontSize: 11, color: COLORS.muted }}>
                        {zone.plants.length <= 1
                          ? `${zone.plants.length} élément`
                          : `${zone.plants.length} éléments`}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "0 16px",
                        marginBottom: 18,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 10,
                      }}
                    >
                      {zone.plants.map((plante) => (
                        <PlantCard key={plante.id} plante={plante} t={t} />
                      ))}
                    </div>
                  </div>
                ))}

              <div
                style={{
                  margin: "2px 16px 18px",
                  border: `0.5px dashed ${COLORS.borderStrong}`,
                  borderRadius: 13,
                  background: COLORS.note,
                  padding: "13px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <IconMessage /> Mon mot pour le paysagiste
                </div>
                <textarea
                  value={gardenIntention}
                  onChange={handleIntentionChange}
                  placeholder="Ex : un jardin facile à vivre, un coin ombragé pour manger dehors, cacher le mur du fond côté voisin…"
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    resize: "vertical",
                    fontSize: 12,
                    color: COLORS.ink,
                    lineHeight: 1.55,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}
    </>
  );
}
