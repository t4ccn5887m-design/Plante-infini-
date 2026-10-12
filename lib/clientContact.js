import { getCloudSession } from "@/lib/cloudSync";
import { loadPremiumProfile, savePremiumProfile } from "@/lib/premiumProfile";
import { supabase } from "@/lib/supabase";

export const CLIENT_CONTACT_PROFILE_HINT =
  "Ajoutez vos coordonnées pour que votre paysagiste puisse vous recontacter";

function splitLegacyDisplayName(displayName) {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function metadataToFields(metadata = {}) {
  return {
    firstName: String(metadata.first_name || "").trim(),
    lastName: String(metadata.last_name || "").trim(),
    phone: String(metadata.phone || "").trim(),
    city: String(metadata.city || "").trim(),
    postalCode: String(metadata.postal_code || "").trim(),
  };
}

/** Profil client depuis le cache local (avec migration displayName → prénom). */
export function loadClientContactFromCache() {
  const local = loadPremiumProfile();
  const fromLegacy = splitLegacyDisplayName(local.displayName);
  return {
    firstName: local.firstName?.trim() || fromLegacy.firstName,
    lastName: local.lastName?.trim() || fromLegacy.lastName,
    phone: local.phone?.trim() || "",
    city: local.city?.trim() || local.address?.trim() || "",
    postalCode: local.postalCode?.trim() || "",
    email: local.email?.trim() || "",
  };
}

export function clientContactToPremiumProfile(contact) {
  const firstName = contact.firstName?.trim() || "";
  const lastName = contact.lastName?.trim() || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return {
    displayName,
    firstName,
    lastName,
    phone: contact.phone?.trim() || "",
    city: contact.city?.trim() || "",
    postalCode: contact.postalCode?.trim() || "",
    email: contact.email?.trim() || "",
    address: contact.city?.trim() || "",
  };
}

export function isClientContactComplete(contact) {
  return Boolean(
    contact?.firstName?.trim() &&
      contact?.lastName?.trim() &&
      contact?.phone?.trim() &&
      contact?.city?.trim() &&
      contact?.postalCode?.trim()
  );
}

/** Fusionne user_metadata Supabase + cache local + e-mail session. */
export async function loadClientContact() {
  const cached = loadClientContactFromCache();
  let email = cached.email;

  try {
    const session = await getCloudSession();
    const user = session?.user;
    if (user?.email) email = user.email;

    if (user?.user_metadata) {
      const fromMeta = metadataToFields(user.user_metadata);
      const merged = {
        firstName: fromMeta.firstName || cached.firstName,
        lastName: fromMeta.lastName || cached.lastName,
        phone: fromMeta.phone || cached.phone,
        city: fromMeta.city || cached.city,
        postalCode: fromMeta.postalCode || cached.postalCode,
        email,
      };
      savePremiumProfile(clientContactToPremiumProfile(merged));
      return merged;
    }
  } catch {
    /* cache only */
  }

  return { ...cached, email };
}

export async function saveClientContact(contact) {
  const payload = {
    firstName: contact.firstName?.trim() || "",
    lastName: contact.lastName?.trim() || "",
    phone: contact.phone?.trim() || "",
    city: contact.city?.trim() || "",
    postalCode: contact.postalCode?.trim() || "",
    email: contact.email?.trim() || "",
  };

  savePremiumProfile(clientContactToPremiumProfile(payload));

  if (!supabase) {
    return { ok: true, localOnly: true };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone,
      city: payload.city,
      postal_code: payload.postalCode,
    },
  });

  if (error) {
    console.error("[Sevya] client contact save:", error);
    return { ok: false, error: error.message || "save_failed" };
  }

  return { ok: true };
}

/** Format export Ma Palette / PDF palette. */
export function clientContactForExport(contact) {
  return {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    phone: contact.phone || "",
    email: contact.email || "",
    city: [contact.postalCode, contact.city].filter(Boolean).join(" ").trim(),
  };
}
