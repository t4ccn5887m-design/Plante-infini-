import { useMemo } from "react";
import { buildPokedexCollection } from "@/lib/pokedex";
import { getTypeLabel, getRarityLabel } from "@/lib/i18n";

export default function PokedexCollection({ discoveries, t, onOpenDiscovery }) {
  const collection = useMemo(() => buildPokedexCollection(discoveries), [discoveries]);
  const typeLbl = (type) => getTypeLabel(t, type);
  const rarityLbl = (r) => getRarityLabel(t, r);

  return (
    <div className="pokedex-collection">
      <div className="pokedex-progress">
        <div className="pokedex-progress-bar">
          <div
            className="pokedex-progress-fill"
            style={{ width: `${collection.completionPct}%` }}
          />
        </div>
        <p className="pokedex-progress-label">
          {t("pokedex.progress", {
            caught: collection.caughtCount,
            types: collection.totalTypes,
            pct: collection.completionPct,
          })}
        </p>
      </div>

      <div className="pokedex-grid">
        {collection.entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`pokedex-card pokedex-card--caught rarity-${entry.rarete}`}
            onClick={() => onOpenDiscovery?.(entry)}
          >
            {entry.photo ? (
              <img src={entry.photo} alt="" className="pokedex-card-photo" />
            ) : (
              <span className="pokedex-card-placeholder" aria-hidden="true">
                ?
              </span>
            )}
            <span className="pokedex-card-name">{entry.nom}</span>
            <span className="pokedex-card-type">{typeLbl(entry.type)}</span>
            <span className={`pokedex-card-rarity rarity-${entry.rarete}`}>
              {rarityLbl(entry.rarete)}
            </span>
          </button>
        ))}

        {collection.silhouettes.map((s) => (
          <div key={s.id} className="pokedex-card pokedex-card--silhouette" aria-hidden="false">
            <span className="pokedex-card-silhouette">{s.emoji}</span>
            <span className="pokedex-card-name pokedex-card-name--muted">
              {typeLbl(s.type)}
            </span>
            <span className="pokedex-card-type">{t("pokedex.undiscovered")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
