import BriefChipGroup from "@/components/brief/BriefChipGroup";
import {
  UPKEEP_AVAILABILITY,
  UPKEEP_CONTRACT,
  UPKEEP_TIME,
  UPKEEP_WHO,
  UPKEEP_WHEN,
} from "@/lib/brief/stepOptions";
import { normalizeBriefDetails } from "@/lib/brief/briefDetails";

export { isEntretienValid } from "@/lib/brief/briefDetails";

export default function StepEntretien({ details, onDetailsChange }) {
  const d = normalizeBriefDetails(details).upkeep;

  const patchUpkeep = (patch) => {
    onDetailsChange((prev) => {
      const norm = normalizeBriefDetails(prev);
      return {
        ...norm,
        upkeep: { ...norm.upkeep, ...patch },
      };
    });
  };

  return (
    <>
      <BriefChipGroup
        label="Qui l'entretiendra ?"
        options={UPKEEP_WHO}
        mode="single"
        value={d.who}
        onChange={(who) => patchUpkeep({ who })}
      />
      <BriefChipGroup
        label="Temps que vous voulez y passer"
        options={UPKEEP_TIME}
        mode="single"
        value={d.time}
        onChange={(time) => patchUpkeep({ time })}
      />
      <BriefChipGroup
        label="Un contrat d'entretien avec votre paysagiste ?"
        options={UPKEEP_CONTRACT}
        mode="single"
        value={d.contract}
        onChange={(contract) => patchUpkeep({ contract })}
      />
      <BriefChipGroup
        label="Pour quand ?"
        options={UPKEEP_WHEN}
        mode="single"
        value={d.when}
        onChange={(when) => patchUpkeep({ when })}
      />
      <div className="bf-section-label">Une date importante ?</div>
      <textarea
        className="bf-textarea"
        rows={2}
        placeholder="Ex. : avant la communion en juin"
        value={d.date_note}
        onChange={(e) => patchUpkeep({ date_note: e.target.value })}
      />
      <BriefChipGroup
        label="Vos disponibilités pour le rendez-vous"
        options={UPKEEP_AVAILABILITY}
        mode="multi"
        value={d.availability}
        onChange={(availability) => patchUpkeep({ availability })}
      />
    </>
  );
}
