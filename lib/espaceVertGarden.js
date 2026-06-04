import { getRootAlbums } from "@/lib/themes";
import { getAllJardinPlants } from "@/lib/espaceVertSurprise";

export { getAllJardinPlants };

export function getDefaultJardinAlbumId(albums) {
  const roots = getRootAlbums(albums, "jardin").sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  return roots[0]?.id ?? null;
}

export function discoveryToScanResult(discovery) {
  if (!discovery) return null;
  return {
    nom: discovery.nom,
    nom_latin: discovery.nom_latin || null,
    famille: discovery.famille || null,
    description: discovery.description || "",
    identification_note: discovery.identification_note || null,
    age_approximatif: discovery.age_approximatif || null,
    histoire: discovery.histoire || null,
    anecdotes: discovery.anecdotes || null,
    habitat: discovery.habitat || null,
    etat_sante: discovery.etat_sante || null,
    guide_entretien: discovery.guide_entretien || null,
    soins_traitement: discovery.soins_traitement || null,
    conseils_expert: discovery.conseils_expert || null,
    fun_fact: discovery.fun_fact || null,
    dangerosite: discovery.dangerosite || null,
    infos_utiles: discovery.infos_utiles || null,
  };
}

export function buildJardinStory(result) {
  const parts = [];
  if (result?.description?.trim()) parts.push(result.description.trim());
  if (result?.histoire?.trim()) parts.push(result.histoire.trim());
  if (result?.habitat?.trim()) parts.push(result.habitat.trim());
  if (result?.anecdotes?.trim()) parts.push(result.anecdotes.trim());
  return parts.join("\n\n");
}
