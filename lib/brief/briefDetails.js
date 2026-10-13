import {
  UPKEEP_TIME,
  UPKEEP_WHEN,
} from "@/lib/brief/stepOptions";

export const EMPTY_BRIEF_DETAILS = {
  household: { children: null, pets: [], uses: [] },
  avoid: { items: [], other: "" },
  existing: {
    orientation: null,
    slope: null,
    soil: null,
    keep: "",
    remove: "",
  },
  upkeep: {
    who: null,
    time: null,
    contract: null,
    when: null,
    date_note: "",
    availability: [],
  },
};

function normStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim());
}

function normOptionalString(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

export function normalizeBriefDetails(raw) {
  const base = EMPTY_BRIEF_DETAILS;
  const src = raw && typeof raw === "object" ? raw : {};
  const household = src.household && typeof src.household === "object" ? src.household : {};
  const avoid = src.avoid && typeof src.avoid === "object" ? src.avoid : {};
  const existing = src.existing && typeof src.existing === "object" ? src.existing : {};
  const upkeep = src.upkeep && typeof src.upkeep === "object" ? src.upkeep : {};

  let pets = normStringArray(household.pets);
  if (typeof household.pets === "string" && household.pets.trim()) {
    pets = [household.pets.trim()];
  }

  return {
    household: {
      children: normOptionalString(household.children),
      pets,
      uses: normStringArray(household.uses),
    },
    avoid: {
      items: normStringArray(avoid.items),
      other: typeof avoid.other === "string" ? avoid.other : "",
    },
    existing: {
      orientation: normOptionalString(existing.orientation),
      slope: normOptionalString(existing.slope),
      soil: normOptionalString(existing.soil),
      keep: typeof existing.keep === "string" ? existing.keep : "",
      remove: typeof existing.remove === "string" ? existing.remove : "",
    },
    upkeep: {
      who: normOptionalString(upkeep.who),
      time: normOptionalString(upkeep.time),
      contract: normOptionalString(upkeep.contract),
      when: normOptionalString(upkeep.when),
      date_note: typeof upkeep.date_note === "string" ? upkeep.date_note : "",
      availability: normStringArray(upkeep.availability),
    },
  };
}

export function isQuotidienValid(details) {
  const d = normalizeBriefDetails(details);
  return Boolean(d.household.children) && d.household.pets.length > 0;
}

export function isAEviterValid(details) {
  const d = normalizeBriefDetails(details);
  return d.avoid.items.length > 0;
}

export function isExistantValid(details) {
  const d = normalizeBriefDetails(details);
  return Boolean(d.existing.orientation);
}

export function isEntretienValid(details) {
  const d = normalizeBriefDetails(details);
  return Boolean(d.upkeep.who) && Boolean(d.upkeep.when);
}

/** Mappe le temps d'entretien vers la colonne legacy `maintenance`. */
export function upkeepTimeToMaintenanceId(time) {
  switch (time) {
    case UPKEEP_TIME[0]:
    case UPKEEP_TIME[1]:
      return "min";
    case UPKEEP_TIME[2]:
      return "weekend";
    case UPKEEP_TIME[3]:
      return "love";
    default:
      return null;
  }
}

/** Mappe « pour quand » vers la colonne legacy `timeline`. */
export function upkeepWhenToTimelineId(when) {
  switch (when) {
    case UPKEEP_WHEN[0]:
      return "asap";
    case UPKEEP_WHEN[1]:
    case UPKEEP_WHEN[2]:
      return "year";
    case UPKEEP_WHEN[3]:
      return "exploring";
    default:
      return null;
  }
}
