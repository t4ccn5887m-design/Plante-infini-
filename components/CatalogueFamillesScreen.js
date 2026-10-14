/**
 * Familles du catalogue — sevya/11-familles-catalogue.html
 */

import { useMemo, useState } from "react";
import IdeesCategoryCard from "@/components/atelier/IdeesCategoryCard";
import {
  getCatalogueFamillesScreenData,
  VEGETAL_ENVIE_CHIPS,
} from "@/lib/catalogueFamilles";

const GREEN = "var(--sage)";

function FamilleIcon({ type, stroke }) {
  const ic = { stroke, strokeWidth: 1.8, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "shrub":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" style={ic} />
          <path d="M12 17v4" style={ic} />
        </svg>
      );
    case "hedge":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 14h16M4 10h16M4 6h16" style={ic} />
        </svg>
      );
    case "vine":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v16M8 8c4 0 4 8 0 8M16 8c-4 0-4 8 0 8" style={ic} />
        </svg>
      );
    case "flower":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" style={ic} />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" style={ic} />
        </svg>
      );
    case "grass":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 20c2-8 4-12 6-12s4 4 6 12" style={ic} />
        </svg>
      );
    case "ground":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16c3-2 5-2 8 0s5 2 8 0" style={ic} />
          <path d="M4 20h16" style={ic} />
        </svg>
      );
    case "herb":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20V8M12 8C12 4 8 2 6 6c2-1 4 0 6 2" style={ic} />
        </svg>
      );
    case "tiles":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1.5" style={ic} />
          <rect x="13" y="3" width="8" height="8" rx="1.5" style={ic} />
          <rect x="3" y="13" width="8" height="8" rx="1.5" style={ic} />
          <rect x="13" y="13" width="8" height="8" rx="1.5" style={ic} />
        </svg>
      );
    case "gravel":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="7" cy="10" r="2" style={ic} />
          <circle cx="14" cy="8" r="2" style={ic} />
          <circle cx="17" cy="14" r="2" style={ic} />
          <circle cx="9" cy="16" r="2" style={ic} />
        </svg>
      );
    case "wall":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h16v10H4z" style={ic} />
          <path d="M4 13h16M10 8v10M4 13H10M10 13h10" style={ic} />
        </svg>
      );
    case "steps":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="14" width="6" height="6" style={ic} />
          <rect x="10" y="10" width="6" height="10" style={ic} />
          <rect x="16" y="6" width="4" height="14" style={ic} />
        </svg>
      );
    case "rock":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18 8 8l5 3 4-5 3 12Z" style={ic} />
        </svg>
      );
    case "poured":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 18h18M5 18l3-8h8l3 8" style={ic} />
        </svg>
      );
    case "pergola":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h18M5 7v14M19 7v14" style={ic} />
          <path d="M9 7v4M15 7v4" style={ic} />
        </svg>
      );
    case "water":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3c3 5 6 8 6 11a6 6 0 1 1-12 0c0-3 3-6 6-11z" style={ic} />
        </svg>
      );
    case "light":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18h6M10 22h4M12 2v2M4.2 5.2l1.4 1.4M2 12h2M19.8 5.2l-1.4 1.4M20 12h2" style={ic} />
          <circle cx="12" cy="12" r="4" style={ic} />
        </svg>
      );
    case "furniture":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10h16v8H4zM6 10V6h12v4" style={ic} />
        </svg>
      );
    case "planter":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 10h12l-1 10H7L6 10zM8 10V7h8v3" style={ic} />
        </svg>
      );
    case "fence":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6v14M20 6v14M4 10h16M4 14h16" style={ic} />
        </svg>
      );
    case "deck":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16h16M4 12h16M4 8h16" style={ic} />
        </svg>
      );
    case "structure":
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12" style={ic} />
          <path d="M9 20v-6h6v6" style={ic} />
        </svg>
      );
    case "tree":
    default:
      return (
        <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
            style={ic}
          />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" style={ic} />
        </svg>
      );
  }
}

export default function CatalogueFamillesScreen({
  universe,
  onBack,
  onOpenHub,
}) {
  const data = useMemo(() => getCatalogueFamillesScreenData(universe), [universe]);
  const [searchDraft, setSearchDraft] = useState("");

  if (!data) return null;

  const openSearchHub = () => {
    const q = searchDraft.trim();
    onOpenHub?.(data.hubTab || universe, {
      ...data.hubFilters,
      ...(q ? { search: q } : {}),
    });
  };

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour aux idées"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "var(--card)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 26,
            lineHeight: 1,
            color: "var(--ink)",
            paddingBottom: 3,
          }}
        >
          ‹
        </button>
      </div>

      <h1
        style={{
          margin: "0 0 2px",
          fontSize: 28,
          fontWeight: 300,
          fontFamily: "var(--font-title, Fraunces, serif)",
          color: "var(--ink)",
        }}
      >
        {data.title}
      </h1>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: "#5B6359" }}>{data.subtitle}</p>

      <label
        htmlFor="catalogue-familles-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          padding: "0 15px",
          borderRadius: 16,
          background: "var(--card)",
          marginBottom: 18,
          color: "#5B6359",
          fontSize: 14.5,
        }}
      >
        <svg width={17} height={17} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="#5B6359" strokeWidth={2} />
          <path d="m21 21-4.3-4.3" stroke="#5B6359" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <input
          id="catalogue-familles-search"
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              openSearchHub();
            }
          }}
          placeholder={`Rechercher dans ${data.searchLabel}…`}
          aria-label={`Rechercher dans ${data.searchLabel}`}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 14.5,
            color: "var(--ink)",
            outline: "none",
            minWidth: 0,
          }}
        />
      </label>

      <div className="atelier-famille-grid">
        {data.tiles.map((tile) => (
          <IdeesCategoryCard
            key={tile.categorie}
            title={tile.title}
            count={tile.count}
            photoUrl={tile.coverUrl}
            onClick={() =>
              onOpenHub?.(data.hubTab || universe, {
                ...data.hubFilters,
                categorie: tile.categorie,
              })
            }
          />
        ))}
      </div>

      {data.showGrainLegend ? (
        <section style={{ marginTop: 22 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
            Taille des grains
          </h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: "#5B6359" }}>
            Sur chaque fiche paillage, choisissez fin, moyen ou gros — l&apos;info part dans votre dossier PDF.
          </p>
        </section>
      ) : null}

      {data.showEnvies ? (
        <section style={{ marginTop: 22 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
            Ou selon vos envies
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VEGETAL_ENVIE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => onOpenHub?.("vegetal", chip.filters)}
                style={{
                  minHeight: 40,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: "1.5px solid #E4DED3",
                  background: "var(--card)",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <p style={{ marginTop: 18, textAlign: "center" }}>
        <button
          type="button"
          onClick={() => onOpenHub?.(data.hubTab || universe, { ...data.hubFilters })}
          style={{
            border: "none",
            background: "none",
            color: GREEN,
            fontWeight: 700,
            fontSize: 14.5,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Voir tout ({data.total}) ›
        </button>
      </p>
    </div>
  );
}
