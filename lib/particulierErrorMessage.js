/**
 * Messages utilisateur pour l'app particulier — jamais de codes techniques bruts.
 */

const TECHNICAL = /^[a-z][a-z0-9_]*$/;

function looksTechnical(code) {
  if (!code || typeof code !== "string") return false;
  const t = code.trim();
  return TECHNICAL.test(t) && t.includes("_");
}

/**
 * @param {string} [error]
 * @param {{ action?: "add" | "remove" | "generic" }} [options]
 */
export function particulierErrorMessage(error, options = {}) {
  const { action = "generic" } = options;
  if (!error) {
    return action === "remove"
      ? "Impossible de retirer cet élément pour le moment. Réessayez."
      : "Impossible d'ajouter cet élément pour le moment. Réessayez.";
  }

  const code = String(error).trim();

  if (!looksTechnical(code)) {
    return code;
  }

  switch (code) {
    case "guest_local_only":
    case "not_authenticated":
      return "Connectez-vous pour enregistrer cet élément dans votre jardin.";
    case "cloud_unavailable":
      return "Service momentanément indisponible. Réessayez dans un instant.";
    case "analysis_not_found":
      return action === "remove"
        ? "Impossible de retirer cet élément pour le moment. Réessayez."
        : "Impossible d'ajouter cet élément pour le moment. Réessayez.";
    case "invalid_input":
      return "Cette action n'a pas pu aboutir. Réessayez.";
    default:
      return action === "remove"
        ? "Impossible de retirer cet élément pour le moment. Réessayez."
        : "Impossible d'ajouter cet élément pour le moment. Réessayez.";
  }
}
