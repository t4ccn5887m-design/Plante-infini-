import BriefChipGroup from "@/components/brief/BriefChipGroup";
import {
  EXISTING_ORIENTATION,
  EXISTING_SLOPE,
  EXISTING_SOIL,
} from "@/lib/brief/stepOptions";
import { normalizeBriefDetails } from "@/lib/brief/briefDetails";

export { isExistantValid } from "@/lib/brief/briefDetails";

export default function StepExistant({ details, onDetailsChange }) {
  const d = normalizeBriefDetails(details).existing;

  const patchExisting = (patch) => {
    onDetailsChange((prev) => {
      const norm = normalizeBriefDetails(prev);
      return {
        ...norm,
        existing: { ...norm.existing, ...patch },
      };
    });
  };

  return (
    <>
      <BriefChipGroup
        label="Le jardin est plutôt orienté"
        hint="Le côté où le soleil tape l'après-midi."
        options={EXISTING_ORIENTATION}
        mode="single"
        value={d.orientation}
        onChange={(orientation) => patchExisting({ orientation })}
      />
      <BriefChipGroup
        label="Le terrain est"
        options={EXISTING_SLOPE}
        mode="single"
        value={d.slope}
        onChange={(slope) => patchExisting({ slope })}
      />
      <BriefChipGroup
        label="La terre est plutôt"
        options={EXISTING_SOIL}
        mode="single"
        value={d.soil}
        onChange={(soil) => patchExisting({ soil })}
      />
      <div className="bf-section-label">À garder</div>
      <textarea
        className="bf-textarea"
        rows={2}
        placeholder="Ex. : le grand chêne, la haie du fond"
        value={d.keep}
        onChange={(e) => patchExisting({ keep: e.target.value })}
      />
      <div className="bf-section-label">À enlever</div>
      <textarea
        className="bf-textarea"
        rows={2}
        placeholder="Ex. : la vieille pelouse, les thuyas"
        value={d.remove}
        onChange={(e) => patchExisting({ remove: e.target.value })}
      />
    </>
  );
}
