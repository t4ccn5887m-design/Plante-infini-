import { particulierErrorMessage } from "@/lib/particulierErrorMessage";
import {
  demoteCatalogueStyleFromGarden,
  promoteCatalogueStyleToGarden,
} from "@/lib/promoteCatalogueToGarden";

export async function toggleGardenStyleInGarden({
  style,
  t,
  state,
  canAddToGarden,
  onRequireAccount,
}) {
  const id = style?.id;
  if (!id || !state?.styles) return { ok: false, error: "invalid_input" };

  const alreadyIn = state.styles.inGarden.has(id);

  if (!alreadyIn && !canAddToGarden) {
    onRequireAccount?.(() => promoteCatalogueStyleToGarden(style, t));
    return { ok: true, gated: true };
  }

  const result = alreadyIn
    ? await demoteCatalogueStyleFromGarden(id, state.styles.itemIdsByStyle)
    : await promoteCatalogueStyleToGarden(style, t);

  if (!result.ok && result.error) {
    return {
      ...result,
      error: particulierErrorMessage(result.error, {
        action: alreadyIn ? "remove" : "add",
      }),
    };
  }
  return result;
}
