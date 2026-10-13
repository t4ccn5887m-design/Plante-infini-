/** SMS de confirmation RDV (ouverture via `sms:` après enregistrement). */

function formatRdvForSms(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const date = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const time = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} à ${time}`;
  } catch {
    return "";
  }
}

export function buildRdvConfirmationSmsBody({
  clientName,
  studioName,
  startsAt,
  address,
  city,
}) {
  const first = String(clientName || "bonjour").trim().split(/\s+/)[0] || "bonjour";
  const when = formatRdvForSms(startsAt);
  const place = [address, city].filter(Boolean).join(", ");
  const studio = studioName?.trim() || "votre paysagiste";
  let body = `Bonjour ${first}, c'est ${studio}. Votre rendez-vous est confirmé`;
  if (when) body += ` pour ${when}`;
  body += " (durée 1 h).";
  if (place) body += ` Adresse : ${place}.`;
  body += " À bientôt !";
  return body;
}

export function rdvConfirmationSmsHref({ phone, body }) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return null;
  const text = typeof body === "string" ? body : "";
  return `sms:${digits}?body=${encodeURIComponent(text)}`;
}
