function stableStringify(value) {
  return JSON.stringify(value);
}

/** Empreinte du dossier pour le cache IA (client). */
export async function hashGardenDossierPayloadAsync(payload) {
  const json = stableStringify(payload);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const buf = new TextEncoder().encode(json);
    const digest = await window.crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  }
  let h = 5381;
  for (let i = 0; i < json.length; i += 1) {
    h = (h * 33) ^ json.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}
