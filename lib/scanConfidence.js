export const SCAN_CONFIDENCE_THRESHOLD = 80;

export const LOW_CONFIDENCE_MESSAGE =
  "Je ne suis pas certain de cette identification. Reprends la photo avec un meilleur éclairage ou plus près du sujet.";

export function parseConfidencePercent(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function isScanConfidenceTooLow(parsed, threshold = SCAN_CONFIDENCE_THRESHOLD) {
  const confiance = parseConfidencePercent(parsed?.confiance ?? parsed?.confidence);
  if (confiance === null) return true;
  return confiance < threshold;
}
