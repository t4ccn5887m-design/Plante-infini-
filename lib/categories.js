export const HERITAGE_TYPES = ["monument", "architecture", "site_naturel", "curiosite"];

export const MONUMENT_TYPES = ["monument"];

export function isHeritageType(type) {
  return HERITAGE_TYPES.includes(type);
}

export function isMonumentType(type) {
  return type === "monument";
}
