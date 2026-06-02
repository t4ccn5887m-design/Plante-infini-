export const FAUNA_TYPES = ["animal", "oiseau", "insecte", "papillon", "reptile"];

export function isFaunaType(type) {
  return FAUNA_TYPES.includes(type);
}
