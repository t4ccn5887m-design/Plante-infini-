import { fetchPaletteItems, fetchPalettes, fetchZones } from "@/lib/paletteStorage";
import { getPaysagisteSpecs, PAYSAGISTE_PLACEHOLDER } from "@/lib/paysagisteSpecs";

function isMineralDiscovery(discovery) {
  return (
    discovery?.kind === "mineral" ||
    discovery?.type === "mineral" ||
    Boolean(discovery?.catalogue_mineral_id)
  );
}

function buildVegetalSubtitle(discovery, zoneExposition) {
  if (discovery?.resume) return discovery.resume;

  const specs = getPaysagisteSpecs(discovery);
  const parts = [];

  const expo = discovery?.exposition || zoneExposition;
  if (expo && expo !== PAYSAGISTE_PLACEHOLDER) {
    parts.push(String(expo).replace("-", " "));
  } else if (specs.exposition !== PAYSAGISTE_PLACEHOLDER) {
    parts.push(specs.exposition);
  }

  if (discovery?.floraison && discovery.floraison !== PAYSAGISTE_PLACEHOLDER) {
    parts.push(discovery.floraison);
  } else if (specs.floraison !== PAYSAGISTE_PLACEHOLDER) {
    parts.push(specs.floraison);
  }

  return parts.join(" · ") || null;
}

function buildMineralSubtitle(discovery) {
  if (discovery?.resume) return discovery.resume;
  const parts = [discovery?.materiau, discovery?.finition].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function normalizeBriefItem(item, zoneExposition = null) {
  const discovery = item.discovery || {};
  const isMineral = isMineralDiscovery(discovery);

  return {
    id: item.id,
    nom: discovery.nom || (isMineral ? "Élément minéral" : "Plante"),
    kind: isMineral ? "mineral" : "vegetal",
    favori: Boolean(discovery.favori),
    photo: discovery.photo || discovery.cloudImageUrl || null,
    subtitle: isMineral
      ? buildMineralSubtitle(discovery)
      : buildVegetalSubtitle(discovery, zoneExposition),
    discovery,
    zoneExposition,
  };
}

export async function loadGardenBriefData() {
  const palettesRes = await fetchPalettes();
  if (!palettesRes.ok || !palettesRes.data?.length) {
    return { ok: true, items: [], totalCount: 0, heartCount: 0, error: palettesRes.error };
  }

  const paletteId = palettesRes.data[0].id;
  const [zonesRes, itemsRes] = await Promise.all([
    fetchZones(paletteId),
    fetchPaletteItems(paletteId),
  ]);

  const zonesById = new Map((zonesRes.ok ? zonesRes.data : []).map((z) => [z.id, z]));
  const rawItems = itemsRes.ok ? itemsRes.data : [];

  const items = rawItems
    .map((item) => normalizeBriefItem(item, zonesById.get(item.zone_id)?.exposition))
    .sort((a, b) => {
      if (a.favori !== b.favori) return a.favori ? -1 : 1;
      return a.nom.localeCompare(b.nom, "fr");
    });

  return {
    ok: true,
    items,
    totalCount: items.length,
    heartCount: items.filter((i) => i.favori).length,
  };
}
