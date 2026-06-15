import { getPlantHealth } from "@/lib/espaceVertPlant";
import SwipeToDelete from "@/components/SwipeToDelete";
import WilderEmptyState from "@/components/WilderEmptyState";
import { IconJardin } from "@/components/ThemeIcons";

function HealthDot({ health, t }) {
  const label = t(`themes.jardin.health_status_${health}`);
  return (
    <span
      className={`jardin-list-health jardin-list-health--${health}`}
      aria-label={label}
      title={label}
    />
  );
}

function EspaceVertPlantCard({ discovery, t, onOpen, onDelete, swipeLabels }) {
  const health = getPlantHealth(discovery);

  const card = (
    <button type="button" className="jardin-plant-row" onClick={() => onOpen?.(discovery)}>
      <div className="jardin-plant-row-photo-wrap">
        {discovery.photo ? (
          <img src={discovery.photo} alt="" className="jardin-plant-row-photo" />
        ) : (
          <span className="jardin-plant-row-photo jardin-plant-row-photo--empty" aria-hidden="true">
            🌳
          </span>
        )}
      </div>
      <span className="jardin-plant-row-name">{discovery.nom}</span>
      <HealthDot health={health} t={t} />
    </button>
  );

  if (!onDelete) return card;

  return (
    <SwipeToDelete onDelete={() => onDelete(discovery.id)} {...swipeLabels}>
      {card}
    </SwipeToDelete>
  );
}

export default function EspaceVertPlantList({
  plants,
  t,
  onOpenDiscovery,
  onDeleteDiscovery,
  swipeLabels,
}) {
  if (!plants?.length) {
    return (
      <WilderEmptyState
        icon={<IconJardin size={32} color="currentColor" />}
        message={t("themes.jardin.empty_hint")}
      />
    );
  }

  return (
    <ul className="jardin-plant-list-inner" aria-label={t("themes.jardin.plants_list")}>
      {plants.map((d) => (
        <li key={d.id}>
          <EspaceVertPlantCard
            discovery={d}
            t={t}
            onOpen={onOpenDiscovery}
            onDelete={onDeleteDiscovery}
            swipeLabels={swipeLabels}
          />
        </li>
      ))}
    </ul>
  );
}
