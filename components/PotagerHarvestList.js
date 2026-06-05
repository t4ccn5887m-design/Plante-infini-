import { togglePotagerHarvest } from "@/lib/potagerPlant";

export default function PotagerHarvestList({ plants, t, onChanged }) {
  if (!plants?.length) return null;

  return (
    <section className="potager-harvest" aria-labelledby="potager-harvest-heading">
      <h2 id="potager-harvest-heading" className="potager-harvest-title">
        {t("themes.potager.my_plants")}
      </h2>
      <ul className="potager-harvest-list">
        {plants.map((plant) => (
          <li key={plant.id}>
            <div className="potager-harvest-row">
              <span className="potager-harvest-emoji" aria-hidden="true">
                {plant.emoji}
              </span>
              <span className="potager-harvest-name">{plant.name}</span>
              <button
                type="button"
                className={`potager-harvest-btn${plant.readyToHarvest ? " potager-harvest-btn--ready" : ""}`}
                onClick={() => onChanged?.(togglePotagerHarvest(plant.id))}
                aria-pressed={plant.readyToHarvest}
              >
                {plant.readyToHarvest
                  ? t("themes.potager.harvest_ready")
                  : t("themes.potager.harvest_mark")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
