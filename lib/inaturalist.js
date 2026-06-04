const INAT_BASE = "https://api.inaturalist.org/v1";
const USER_AGENT = "Wilder/1.0 (nature-discovery-app; contact@wilder.app)";

const PROTECTED_KEYWORDS = [
  /réserve\s+naturelle/i,
  /réserve\s+de\s+biosphère/i,
  /parc\s+national/i,
  /natura\s*2000/i,
  /national\s+park/i,
  /nature\s+reserve/i,
  /wildlife\s+refuge/i,
  /protected\s+area/i,
  /area\s+protegida/i,
  /parque\s+nacional/i,
  /riserva\s+naturale/i,
  /nationalpark/i,
  /naturschutzgebiet/i,
  /parque\s+nacional/i,
  /reserva\s+natural/i,
];

const PLACE_SEARCH_TERMS = [
  "réserve naturelle",
  "parc national",
  "Natura 2000",
  "national park",
  "nature reserve",
];

export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isProtectedPlaceName(name) {
  if (!name) return false;
  return PROTECTED_KEYWORDS.some((re) => re.test(name));
}

async function inatFetch(path, params = {}) {
  const url = new URL(`${INAT_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(`${key}[]`, v));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function mapSpeciesEntry(entry) {
  const taxon = entry?.taxon;
  if (!taxon) return null;
  const photo = taxon.default_photo;
  return {
    id: taxon.id,
    commonName: taxon.preferred_common_name || taxon.name,
    scientificName: taxon.name,
    count: entry.count || 0,
    iconicTaxon: taxon.iconic_taxon_name,
    iucn: taxon.conservation_status?.status || null,
    photoUrl: photo?.square_url || photo?.url || null,
  };
}

async function searchPlacesContainingPoint(lat, lng, query, perPage = 50) {
  const data = await inatFetch("/search", {
    q: query,
    sources: ["Place"],
    per_page: perPage,
  });
  const matches = [];
  for (const hit of data?.results || []) {
    const place = hit?.record;
    if (!place?.id) continue;
    if (!isProtectedPlaceName(place.display_name || place.name)) continue;
    if (place.bounding_box_geojson && !pointInBbox(lat, lng, place.bounding_box_geojson)) continue;
    matches.push(place);
  }
  return matches;
}

async function reverseGeocodeRegion(lat, lng) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "10");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    return [
      addr.national_park,
      addr.nature_reserve,
      addr.state,
      addr.county,
      addr.municipality,
      addr.city,
      addr.town,
      addr.village,
    ].filter(Boolean);
  } catch {
    return null;
  }
}

function pointInBbox(lat, lng, bbox) {
  if (!bbox?.coordinates?.[0]?.length) return true;
  const ring = bbox.coordinates[0];
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, latVal] of ring) {
    minLng = Math.min(minLng, lon);
    maxLng = Math.max(maxLng, lon);
    minLat = Math.min(minLat, latVal);
    maxLat = Math.max(maxLat, latVal);
  }
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

async function fetchPlacesByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 12);
  if (!unique.length) return [];
  const results = await Promise.all(
    unique.map((id) => inatFetch(`/places/${id}`).then((data) => data?.results?.[0]))
  );
  return results.filter(Boolean);
}

function addProtectedZone(zones, seen, place, lat, lng, { requireBbox = false } = {}) {
  if (!place?.id || seen.has(place.id)) return;
  const label = place.display_name || place.name;
  if (!isProtectedPlaceName(label)) return;

  if (place.bounding_box_geojson) {
    if (!pointInBbox(lat, lng, place.bounding_box_geojson)) return;
  } else if (requireBbox) {
    return;
  } else if (place.location) {
    const [placeLat, placeLng] = String(place.location).split(",").map(Number);
    if (Number.isFinite(placeLat) && Number.isFinite(placeLng)) {
      if (distanceKm(lat, lng, placeLat, placeLng) > 8) return;
    }
  }

  seen.add(place.id);
  zones.push({
    id: place.id,
    name: place.name || label,
    displayName: label,
  });
}

export async function fetchNearbyNatureContext(lat, lng, { radiusKm = 2, month } = {}) {
  const regionHints = (await reverseGeocodeRegion(lat, lng)) || [];
  const dynamicTerms = regionHints.flatMap((hint) => [
    `${hint} parc national`,
    `${hint} réserve`,
    `${hint} national park`,
    hint,
  ]);

  const searchTerms = [...new Set([...PLACE_SEARCH_TERMS, ...dynamicTerms])].slice(0, 6);
  const protectedSearchQueries = [
    "parc national",
    "réserve naturelle",
    "Natura 2000",
    "nature reserve",
    "national park",
  ];

  const [
    threatenedCounts,
    avesCounts,
    avesMonthCounts,
    obscuredObs,
    nearbyObs,
    ...placeResults
  ] = await Promise.all([
    inatFetch("/observations/species_counts", {
      lat,
      lng,
      radius: radiusKm,
      quality_grade: "research",
      threatened: true,
      per_page: 5,
    }),
    inatFetch("/observations/species_counts", {
      lat,
      lng,
      radius: radiusKm,
      quality_grade: "research",
      iconic_taxa: "Aves",
      per_page: 5,
    }),
    month
      ? inatFetch("/observations/species_counts", {
          lat,
          lng,
          radius: radiusKm,
          quality_grade: "research",
          iconic_taxa: "Aves",
          month,
          per_page: 5,
        })
      : Promise.resolve(null),
    inatFetch("/observations", {
      lat,
      lng,
      radius: radiusKm,
      taxon_geoprivacy: "obscured",
      quality_grade: "research",
      per_page: 1,
    }),
    inatFetch("/observations", {
      lat,
      lng,
      radius: radiusKm,
      quality_grade: "research",
      per_page: 20,
    }),
    ...protectedSearchQueries.map((q) => searchPlacesContainingPoint(lat, lng, q, 60)),
    ...searchTerms.map((q) =>
      inatFetch("/places/autocomplete", { q, lat, lng, per_page: 6 })
    ),
  ]);

  const protectedFromSearch = placeResults.slice(0, protectedSearchQueries.length).flat();
  const autocompleteResults = placeResults.slice(protectedSearchQueries.length);

  const protectedZones = [];
  const seenPlaceIds = new Set();

  for (const place of protectedFromSearch) {
    addProtectedZone(protectedZones, seenPlaceIds, place, lat, lng, { requireBbox: true });
  }

  for (const result of autocompleteResults) {
    for (const place of result?.results || []) {
      addProtectedZone(protectedZones, seenPlaceIds, place, lat, lng);
    }
  }

  const obsPlaceIds = (nearbyObs?.results || []).flatMap((obs) => obs.place_ids || []);
  const obsPlaces = await fetchPlacesByIds(obsPlaceIds);
  for (const place of obsPlaces) {
    addProtectedZone(protectedZones, seenPlaceIds, place, lat, lng);
  }

  if (regionHints[0]) {
    for (const hint of regionHints.slice(0, 2)) {
      if (isProtectedPlaceName(hint)) {
        protectedZones.push({
          id: `osm-${hint}`,
          name: hint,
          displayName: hint,
        });
      }
    }
  }

  const rareSpecies = (threatenedCounts?.results || [])
    .map(mapSpeciesEntry)
    .filter(Boolean)
    .slice(0, 4);

  const nestBirds = (avesMonthCounts?.results || avesCounts?.results || [])
    .map(mapSpeciesEntry)
    .filter(Boolean)
    .slice(0, 3);

  const birdCount = avesCounts?.total_results || 0;
  const sensitiveArea = (obscuredObs?.total_results || 0) > 0;

  return {
    protectedZones: protectedZones.slice(0, 3),
    sensitiveArea,
    rareSpecies,
    nestBirds,
    birdCount,
    nestingSeason: isNestingSeason(lat, month),
  };
}

export function isNestingSeason(lat, month) {
  if (!month) return false;
  const northern = lat >= 0;
  if (northern) return month >= 3 && month <= 7;
  return month >= 9 || month <= 1;
}
