import {
  GARDEN_AMBIANCE_IDS,
  GARDEN_AMBIANCE_META,
} from "@/lib/gardenAmbianceContent";
import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { GardenStepHeader } from "@/components/garden/GardenFlowScreen";

export default function GardenAmbianceListScreen({ onBack, onOpenAmbiance }) {
  const chosen = loadGardenAmbianceChoice();

  return (
    <div style={{ padding: "0 0 24px" }}>
      <GardenStepHeader
        onBack={onBack}
        kicker="Étape 2 · Ambiance"
        title={
          <>
            Quelle ambiance
            <br />
            vous ressemble ?
          </>
        }
        subtitle="Une seule, vous pourrez changer."
      />
      <div className="atelier-amb-grid">
        {GARDEN_AMBIANCE_IDS.map((name) => {
          const meta = GARDEN_AMBIANCE_META[name];
          const isChosen = chosen === name;
          return (
            <button
              key={name}
              type="button"
              className={`atelier-amb-card${isChosen ? " atelier-amb-card--on" : ""}`}
              onClick={() => onOpenAmbiance(name)}
            >
              {meta?.coverUrl ? (
                <img className="atelier-amb-card__img" src={meta.coverUrl} alt="" />
              ) : (
                <div className="atelier-amb-card__img atelier-amb-card__img--empty" />
              )}
              <div className="atelier-amb-card__shade" aria-hidden="true" />
              <div className="atelier-amb-card__cap">
                <b>{name}</b>
                {meta?.subtitle ? <span>{meta.subtitle}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
