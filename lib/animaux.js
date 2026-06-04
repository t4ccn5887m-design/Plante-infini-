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
