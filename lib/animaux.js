import { getRootAlbums } from "@/lib/themes";
import { isFaunaType } from "@/lib/fauna";

export function getDefaultAnimauxAlbumId(albums) {
  const roots = getRootAlbums(albums, "juniors").sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  return roots[0]?.id ?? null;
}

export function getAllAnimaux(albums, discoveries) {
  const themedAlbums = getRootAlbums(albums, "juniors");
  const ids = new Set();
  for (const album of themedAlbums) {
    for (const id of album.discoveryIds || []) ids.add(id);
  }
  return discoveries
    .filter((d) => ids.has(d.id) && isFaunaType(d.type))
    .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
}

export function discoveryToAnimalResult(discovery) {
  if (!discovery) return null;
  return {
    nom: discovery.nom,
    nom_latin: discovery.nom_latin || null,
    type: discovery.type,
    famille: discovery.famille || null,
    description: discovery.description || "",
    identification_note: discovery.identification_note || null,
    habitat: discovery.habitat || null,
    alimentation: discovery.alimentation || null,
    comportement: discovery.comportement || null,
    anecdotes: discovery.anecdotes || null,
    fun_fact: discovery.fun_fact || null,
    dangerosite: discovery.dangerosite || null,
    infos_utiles: discovery.infos_utiles || null,
    rarete: discovery.rarete || "commun",
    espece_protegee: discovery.espece_protegee ?? null,
    region_saison: discovery.region_saison || null,
    discovery_mode: discovery.discovery_mode || null,
    histoire: discovery.histoire || null,
    activite_probable: discovery.activite_probable || null,
    heure_probable: discovery.heure_probable || null,
    habitudes_saison: discovery.habitudes_saison || null,
    comment_observer: discovery.comment_observer || null,
    chances_observer: discovery.chances_observer || null,
    fait_surprenant: discovery.fait_surprenant || null,
    indice_type: discovery.indice_type || null,
    description_chant: discovery.description_chant || null,
  };
}

export function buildAnimalDiscoveryFields(data) {
  return {
    discovery_mode: data.discovery_mode || null,
    histoire: data.histoire || "",
    activite_probable: data.activite_probable || "",
    heure_probable: data.heure_probable || "",
    habitudes_saison: data.habitudes_saison || "",
    comment_observer: data.comment_observer || "",
    chances_observer: data.chances_observer || "",
    fait_surprenant: data.fait_surprenant || data.fun_fact || "",
    indice_type: data.indice_type || "",
    description_chant: data.description_chant || "",
  };
}

export function isProtectedSpecies(result) {
  if (result?.espece_protegee === true) return true;
  if (result?.espece_protegee === false) return false;
  const rarete = result?.rarete;
  return rarete === "rare" || rarete === "tres_rare";
}

export function buildAnimalStory(result) {
  const parts = [];
  if (result?.description?.trim()) parts.push(result.description.trim());
  if (result?.habitat?.trim()) parts.push(result.habitat.trim());
  if (result?.alimentation?.trim()) parts.push(result.alimentation.trim());
  if (result?.comportement?.trim()) parts.push(result.comportement.trim());
  if (result?.anecdotes?.trim()) parts.push(result.anecdotes.trim());
  if (result?.fun_fact?.trim()) parts.push(result.fun_fact.trim());
  return parts.join("\n\n");
}
