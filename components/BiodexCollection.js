import { useMemo } from "react";
import { buildBiodexCollection } from "@/lib/biodex";
import { getTypeLabel, getRarityLabel } from "@/lib/i18n";

export default function BiodexCollection({ discoveries, t, onOpenDiscovery }) {
  const collection = useMemo(() => buildBiodexCollection(discoveries), [discoveries]);
  const typeLbl = (type) => getTypeLabel(t, type);
  const rarityLbl = (r) => getRarityLabel(t, r);

  return (
    <div className="biodex-collection">
      <div className="biodex-progress">
        <div className="biodex-progress-bar">
          <div
            className="biodex-progress-fill"
            style={{ width: `${collection.completionPct}%` }}
          />
        </div>
        <p className="biodex-progress-label">
          {t("biodex.progress", {
            caught: collection.caughtCount,
            types: collection.totalTypes,
            pct: collection.completionPct,
          })}
        </p>
      </div>

      <div className="biodex-grid">
        {collection.entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`biodex-card biodex-card--caught rarity-${entry.rarete}`}
            onClick={() => onOpenDiscovery?.(entry)}
          >
            {entry.photo ? (
              <img src={entry.photo} alt="" className="biodex-card-photo" />
            ) : (
              <span className="biodex-card-placeholder" aria-hidden="true">
                ?
              </span>
            )}
            <span className="biodex-card-name">{entry.nom}</span>
            <span className="biodex-card-type">{typeLbl(entry.type)}</span>
            <span className={`biodex-card-rarity rarity-${entry.rarete}`}>
              {rarityLbl(entry.rarete)}
            </span>
          </button>
        ))}

        {collection.silhouettes.map((s) => (
          <div key={s.id} className="biodex-card biodex-card--silhouette" aria-hidden="false">
            <span className="biodex-card-silhouette">{s.emoji}</span>
            <span className="biodex-card-name biodex-card-name--muted">
              {typeLbl(s.type)}
            </span>
            <span className="biodex-card-type">{t("biodex.undiscovered")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
