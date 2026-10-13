import BriefChipGroup from "@/components/brief/BriefChipGroup";
import { AVOID_ITEMS } from "@/lib/brief/stepOptions";
import { normalizeBriefDetails } from "@/lib/brief/briefDetails";

export { isAEviterValid } from "@/lib/brief/briefDetails";

export default function StepAEviter({ details, onDetailsChange }) {
  const d = normalizeBriefDetails(details).avoid;

  const patchAvoid = (patch) => {
    onDetailsChange((prev) => {
      const norm = normalizeBriefDetails(prev);
      return {
        ...norm,
        avoid: { ...norm.avoid, ...patch },
      };
    });
  };

  return (
    <>
      <BriefChipGroup
        label="Je ne veux pas"
        options={AVOID_ITEMS}
        mode="multi"
        value={d.items}
        onChange={(items) => patchAvoid({ items })}
      />
      <div className="bf-section-label">Autre chose ?</div>
      <textarea
        className="bf-textarea"
        rows={3}
        placeholder="Ex. : pas de bambous, le voisin en a partout"
        value={d.other}
        onChange={(e) => patchAvoid({ other: e.target.value })}
      />
    </>
  );
}
