import { useMemo } from "react";
import { getAllAnimaux } from "@/lib/animaux";
import SwipeToDelete from "@/components/SwipeToDelete";

export default function AnimauxView({
  albums,
  discoveries,
  onStartScan,
  onOpenAnimal,
  onDeleteDiscovery,
  swipeLabels,
  t,
}) {
  const animals = useMemo(
    () => getAllAnimaux(albums, discoveries),
    [albums, discoveries]
  );

  return (
    <div className="animaux-simple">
      <button type="button" className="animaux-scan-cta" onClick={() => onStartScan?.()}>
        <span className="animaux-scan-cta-emoji" aria-hidden="true">
          📸
        </span>
        <span className="animaux-scan-cta-label">{t("themes.juniors.scan_cta")}</span>
      </button>

      <section className="animaux-list" aria-label={t("themes.juniors.my_animals")}>
        {animals.length === 0 ? (
          <p className="animaux-list-empty">{t("themes.juniors.empty_hint")}</p>
        ) : (
          <ul>
            {animals.map((animal) => {
              const row = (
                <button
                  type="button"
                  className="animaux-row"
                  onClick={() => onOpenAnimal?.(animal)}
                >
                  <div className="animaux-row-photo-wrap">
                    {animal.photo ? (
                      <img src={animal.photo} alt="" className="animaux-row-photo" />
                    ) : (
                      <span
                        className="animaux-row-photo animaux-row-photo--empty"
                        aria-hidden="true"
                      >
                        🦊
                      </span>
                    )}
                  </div>
                  <div className="animaux-row-info">
                    <span className="animaux-row-name">{animal.nom}</span>
                    {animal.habitat && (
                      <span className="animaux-row-habitat">{animal.habitat}</span>
                    )}
                  </div>
                </button>
              );

              return (
                <li key={animal.id}>
                  {onDeleteDiscovery ? (
                    <SwipeToDelete
                      onDelete={() => onDeleteDiscovery(animal.id)}
                      {...swipeLabels}
                    >
                      {row}
                    </SwipeToDelete>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
