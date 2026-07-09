/**
 * Mon projet jardin — écran d'accueil.
 * Maquette : wilder/wilder_ecran_mon_jardin_v3.html
 */

import { useCallback, useEffect, useState } from "react";
import AccountMenu from "@/components/AccountMenu";
import { loadGardenIntention, saveGardenIntention } from "@/lib/gardenIntention";
import { fetchPalettes, fetchPaletteItems, fetchZones } from "@/lib/paletteStorage";

const COLORS = {
  ink: "#1e2b23",
  muted: "#8b9084",
  border: "#e6e2d8",
  borderStrong: "#cbc6b8",
  greenTint: "#e7efe6",
  greenInk: "#3c6b47",
  purpleTint: "#efedfb",
  purpleInk: "#6a58a2",
  heart: "#c6504c",
  note: "#f4f2ea",
  primary: "#2f5a3c",
  screen: "#ffffff",
};

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

function plantsCountLabel(n) {
  return n <= 1 ? `${n} plante` : `${n} plantes`;
}

function favorisCountLabel(n) {
  if (n <= 1) return `${n} coup de cœur`;
  return `${n} coups de cœur`;
}

function subtitleLabel(totalPlants, totalFavoris) {
  return `${plantsCountLabel(totalPlants)} · ${favorisCountLabel(totalFavoris)}`;
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

function IconHeart() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={{ fill: "currentColor", stroke: "none" }} aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z" />
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

function IconBrief() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PlantCard({ plante, t }) {
  const expo = expositionLabel(t, plante.exposition);
  return (
    <div style={{ border: `0.5px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div
        style={{
          height: 78,
          background: COLORS.greenTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.greenInk,
          position: "relative",
        }}
      >
        {plante.photo ? (
          <img
            src={plante.photo}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
            <IconHeart />
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
      </div>
    </div>
  );
}

const screenWrap = {
  minHeight: "100vh",
  background: "radial-gradient(120% 120% at 50% 0%, #e2ddcf 0%, #cfc9ba 100%)",
  display: "flex",
  justifyContent: "center",
  padding: "16px",
  color: COLORS.ink,
  fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
};

const cardWrap = {
  width: "100%",
  maxWidth: 380,
  background: COLORS.screen,
  borderRadius: 24,
  overflow: "hidden",
  alignSelf: "flex-start",
};

export default function MonJardinScreen({
  t,
  isLoggedIn = false,
  accountUserEmail = "",
  onSignOut,
  onAccountCreated,
  onNavigatePalette,
  onNavigateMesScans,
  onNavigateCatalogue,
  onScan,
  onOpenBrief,
  gardenRefreshTick = 0,
}) {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [totalPlants, setTotalPlants] = useState(0);
  const [totalFavoris, setTotalFavoris] = useState(0);
  const [gardenIntention, setGardenIntention] = useState("");

  const loadGarden = useCallback(async () => {
    setLoading(true);

    const palettesRes = await fetchPalettes();
    if (!palettesRes.ok || !palettesRes.data?.length) {
      setZones([]);
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
            exposition: zone.exposition,
            photo: item.discovery?.photo || item.discovery?.cloudImageUrl || null,
            favori: Boolean(item.discovery?.favori),
          }));
        return { id: zone.id, nom: zone.nom, plants };
      })
      .filter((zone) => zone.plants.length > 0);

    const plantCount = grouped.reduce((sum, z) => sum + z.plants.length, 0);
    const favCount = grouped.reduce(
      (sum, z) => sum + z.plants.filter((p) => p.favori).length,
      0
    );

    setZones(grouped);
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

  const subtitle = loading ? "…" : subtitleLabel(totalPlants, totalFavoris);

  const isEmpty = !loading && zones.length === 0;

  return (
    <div style={screenWrap}>
      <div style={cardWrap}>
        <div
          style={{
            padding: "18px 16px 12px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <AccountMenu
            t={t}
            isLoggedIn={isLoggedIn}
            userEmail={accountUserEmail}
            onSignOut={onSignOut}
            onAccountCreated={onAccountCreated}
            onNavigatePalette={onNavigatePalette}
            onNavigateMesScans={onNavigateMesScans}
            onNavigateCatalogue={onNavigateCatalogue}
            triggerColor={COLORS.primary}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Mon projet jardin
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>

        <div
          style={{
            margin: "0 16px 18px",
            background: COLORS.purpleTint,
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span style={{ flex: "none", marginTop: 1, color: COLORS.purpleInk }}>
            <IconBulb />
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.purpleInk }}>
              Ton style se dessine
            </div>
            <div style={{ fontSize: 12, color: COLORS.purpleInk, lineHeight: 1.5, marginTop: 2 }}>
              Mi-ombre · floraisons violettes · feuillages persistants
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ padding: "8px 16px 24px", fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
            Chargement…
          </div>
        )}

        {isEmpty && (
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
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
              Ton projet est encore vide
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.55, marginTop: 6 }}>
              Scanne une plante qui te plaît, puis ajoute-la à ton jardin depuis Mes scans.
            </div>
            <button
              type="button"
              onClick={onScan}
              style={{
                marginTop: 14,
                height: 40,
                padding: "0 18px",
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
              }}
            >
              <IconCamera /> Scanner une plante
            </button>
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
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{zone.nom}</span>
                <span style={{ fontSize: 11, color: COLORS.muted }}>
                  {plantsCountLabel(zone.plants.length)}
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

        <div style={{ borderTop: `0.5px solid ${COLORS.border}`, padding: "14px 16px 18px" }}>
          <button
            type="button"
            onClick={onOpenBrief}
            style={{
              width: "100%",
              height: 48,
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <IconBrief /> Voir mon brief
          </button>
          <button
            type="button"
            onClick={onScan}
            style={{
              width: "100%",
              height: 44,
              marginTop: 8,
              background: "transparent",
              border: `0.5px solid ${COLORS.borderStrong}`,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.ink,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <IconCamera /> Scanner une plante
          </button>
        </div>
      </div>
    </div>
  );
}
