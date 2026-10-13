import BriefChipGroup from "@/components/brief/BriefChipGroup";
import {
  HOUSEHOLD_CHILDREN,
  HOUSEHOLD_PETS,
  HOUSEHOLD_USES,
} from "@/lib/brief/stepOptions";
import { normalizeBriefDetails } from "@/lib/brief/briefDetails";

export { isQuotidienValid } from "@/lib/brief/briefDetails";

export default function StepQuotidien({ details, onDetailsChange }) {
  const d = normalizeBriefDetails(details).household;

  const patchHousehold = (patch) => {
    onDetailsChange((prev) => {
      const norm = normalizeBriefDetails(prev);
      return {
        ...norm,
        household: { ...norm.household, ...patch },
      };
    });
  };

  return (
    <>
      <BriefChipGroup
        label="Enfants"
        options={HOUSEHOLD_CHILDREN}
        mode="single"
        value={d.children}
        onChange={(children) => patchHousehold({ children })}
      />
      <BriefChipGroup
        label="Animaux"
        hint="Certaines plantes sont toxiques pour eux : votre paysagiste en tiendra compte."
        options={HOUSEHOLD_PETS}
        mode="single"
        value={d.pets[0] || null}
        onChange={(pet) => patchHousehold({ pets: pet ? [pet] : [] })}
      />
      <BriefChipGroup
        label="Vous y ferez surtout…"
        options={HOUSEHOLD_USES}
        mode="multi"
        value={d.uses}
        onChange={(uses) => patchHousehold({ uses })}
      />
    </>
  );
}
