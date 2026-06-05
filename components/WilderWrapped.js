import { useMemo, useState } from "react";
import { computeWrapped, shareWrapped } from "@/lib/wrapped";
import { getTypeLabel } from "@/lib/i18n";

export default function WilderWrapped({ discoveries, albums, t, year }) {
  const [sharing, setSharing] = useState(false);
  const wrapped = useMemo(
    () => computeWrapped(discoveries, albums, year),
    [discoveries, albums, year]
  );
  const typeLbl = (type) => (type ? getTypeLabel(t, type) : "—");

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareWrapped(wrapped, t, typeLbl);
    } catch {
      /* cancelled */
    } finally {
      setSharing(false);
    }
  };

  if (!wrapped.hasData) {
    return (
      <div className="wrapped-empty">
        <p>{t("wrapped.empty", { year })}</p>
      </div>
    );
  }

  return (
    <div className="wrapped-cards">
      <div className="wrapped-card wrapped-card--hero">
        <span className="wrapped-card-emoji" aria-hidden="true">🌿</span>
        <h2>{t("wrapped.title", { year })}</h2>
        <p className="wrapped-card-big">{wrapped.total}</p>
        <p>{t("wrapped.discoveries")}</p>
      </div>

      <div className="wrapped-card">
        <p className="wrapped-card-label">{t("wrapped.unique")}</p>
        <p className="wrapped-card-value">{wrapped.uniqueSpecies}</p>
      </div>

      <div className="wrapped-card wrapped-card--rare">
        <p className="wrapped-card-label">{t("wrapped.rare")}</p>
        <p className="wrapped-card-value">{wrapped.rareCount}</p>
      </div>

      {wrapped.favoriteType && (
        <div className="wrapped-card">
          <p className="wrapped-card-label">{t("wrapped.favorite")}</p>
          <p className="wrapped-card-value">{typeLbl(wrapped.favoriteType)}</p>
        </div>
      )}

      {wrapped.randoKm > 0 && (
        <div className="wrapped-card">
          <p className="wrapped-card-label">{t("wrapped.rando_km")}</p>
          <p className="wrapped-card-value">{wrapped.randoKm} km</p>
        </div>
      )}

      <div className="wrapped-card">
        <p className="wrapped-card-label">{t("wrapped.badges")}</p>
        <p className="wrapped-card-value">{wrapped.badgesUnlocked}</p>
      </div>

      {wrapped.topSpecies.length > 0 && (
        <div className="wrapped-card wrapped-card--wide">
          <p className="wrapped-card-label">{t("wrapped.top_species")}</p>
          <ul className="wrapped-species-list">
            {wrapped.topSpecies.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="btn-primary wrapped-share-btn"
        onClick={handleShare}
        disabled={sharing}
      >
        {sharing ? t("discovery.share_generating") : `📤 ${t("wrapped.share")}`}
      </button>
    </div>
  );
}
