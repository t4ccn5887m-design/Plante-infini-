import { useEffect, useMemo, useState } from "react";
import { buildNatureAlerts, useRandoNatureAlerts } from "@/lib/useRandoNatureAlerts";

function NatureAlertCard({ alert, t, onDismiss }) {
  const species = alert.species;
  const singleSpecies = species && !Array.isArray(species) ? species : null;
  const speciesList = Array.isArray(species) ? species : [];

  return (
    <div className={`rando-nature-alert rando-nature-alert--${alert.type}`} role="status">
      <span className="rando-nature-alert-icon" aria-hidden="true">
        {alert.icon}
      </span>
      <div className="rando-nature-alert-body">
        <p className="rando-nature-alert-title">{alert.title}</p>
        <p className="rando-nature-alert-message">{alert.message}</p>
        {singleSpecies?.photoUrl && (
          <div className="rando-nature-alert-species">
            <img src={singleSpecies.photoUrl} alt="" className="rando-nature-alert-photo" />
            <span className="rando-nature-alert-latin">{singleSpecies.scientificName}</span>
          </div>
        )}
        {speciesList.length > 0 && alert.type === "nesting" && (
          <ul className="rando-nature-alert-list">
            {speciesList.map((sp) => (
              <li key={sp.id}>
                {sp.commonName}
                {sp.count > 1 ? ` (${sp.count})` : ""}
              </li>
            ))}
          </ul>
        )}
        <p className="rando-nature-alert-source">{t("themes.randos.alert_source")}</p>
      </div>
      <button
        type="button"
        className="rando-nature-alert-dismiss"
        onClick={() => onDismiss(alert.id)}
        aria-label={t("themes.randos.alert_dismiss")}
      >
        ×
      </button>
    </div>
  );
}

export default function RandoNatureAlerts({ position, active, t, className = "" }) {
  const { context } = useRandoNatureAlerts(position, active);
  const [dismissed, setDismissed] = useState(() => new Set());

  const allAlerts = useMemo(() => buildNatureAlerts(context, t), [context, t]);

  const visibleAlerts = useMemo(
    () => allAlerts.filter((a) => !dismissed.has(a.id)).slice(0, 3),
    [allAlerts, dismissed]
  );

  useEffect(() => {
    if (!active) setDismissed(new Set());
  }, [active]);

  if (!active || visibleAlerts.length === 0) return null;

  return (
    <div className={`rando-nature-alerts ${className}`.trim()} aria-live="polite">
      {visibleAlerts.map((alert) => (
        <NatureAlertCard
          key={alert.id}
          alert={alert}
          t={t}
          onDismiss={(id) => setDismissed((prev) => new Set(prev).add(id))}
        />
      ))}
    </div>
  );
}
