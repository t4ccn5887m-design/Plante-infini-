import {
  formatPlantDate,
  getPlantHealth,
  getPlantLastWateredAt,
  getPlantPlantedAt,
} from "@/lib/espaceVertPlant";

function HealthIndicator({ health, t }) {
  const label =
    health === "critical"
      ? t("themes.potager.health_critical")
      : health === "warning"
        ? t("themes.potager.health_warning")
        : t("themes.potager.health_good");
  return (
    <span
      className={`ev-plant-health ev-plant-health--${health}`}
      title={label}
      aria-label={label}
    />
  );
}

function EspaceVertPlantCard({ discovery, locale, t, onScan, onOpen }) {
  const health = getPlantHealth(discovery);
  const planted = formatPlantDate(getPlantPlantedAt(discovery), locale);
  const wateredAt = getPlantLastWateredAt(discovery);
  const watered = wateredAt
    ? formatPlantDate(wateredAt, locale)
    : t("themes.jardin.watering_unknown");

  return (
    <article className="ev-plant-card">
      <button
        type="button"
        className="ev-plant-card-main"
        onClick={() => onOpen?.(discovery)}
      >
        <div className="ev-plant-photo-wrap">
          {discovery.photo ? (
            <img src={discovery.photo} alt="" className="ev-plant-photo" />
          ) : (
            <div className="ev-plant-photo ev-plant-photo--placeholder" aria-hidden="true">
              🌱
            </div>
          )}
          <HealthIndicator health={health} t={t} />
        </div>
        <div className="ev-plant-body">
          <h3 className="ev-plant-name">{discovery.nom}</h3>
          {discovery.nom_latin && (
            <p className="ev-plant-latin">{discovery.nom_latin}</p>
          )}
          <dl className="ev-plant-meta">
            <div className="ev-plant-meta-row">
              <dt>{t("themes.jardin.plant_planted")}</dt>
              <dd>{planted || "—"}</dd>
            </div>
            <div className="ev-plant-meta-row">
              <dt>{t("themes.jardin.plant_last_watered")}</dt>
              <dd>{watered}</dd>
            </div>
          </dl>
        </div>
      </button>
      <button
        type="button"
        className="ev-plant-scan-btn"
        onClick={() => onScan(discovery)}
      >
        {t("albums.scan")}
      </button>
    </article>
  );
}

export default function EspaceVertPlantList({
  plants,
  locale,
  t,
  onScanPlant,
  onOpenDiscovery,
}) {
  if (plants.length === 0) {
    return (
      <div className="ev-plant-empty albums-empty">
        <span className="ev-empty-icon" aria-hidden="true">
          🌱
        </span>
        <p>{t("themes.jardin.plants_empty")}</p>
      </div>
    );
  }

  return (
    <ul className="ev-plant-list" aria-label={t("themes.jardin.plants_list")}>
      {plants.map((d) => (
        <li key={d.id}>
          <EspaceVertPlantCard
            discovery={d}
            locale={locale}
            t={t}
            onScan={onScanPlant}
            onOpen={onOpenDiscovery}
          />
        </li>
      ))}
    </ul>
  );
}
