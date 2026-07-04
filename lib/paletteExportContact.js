import { loadPremiumProfile } from "@/lib/premiumProfile";
import { supabase } from "@/lib/supabase";

const CONTACT_KEY = "wilder-palette-export-contact";

export const EMPTY_EXPORT_CONTACT = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
};

export function loadPaletteExportContact() {
  if (typeof window === "undefined") return { ...EMPTY_EXPORT_CONTACT };
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: data.phone || "",
      email: data.email || "",
      city: data.city || "",
    };
  } catch {
    return { ...EMPTY_EXPORT_CONTACT };
  }
}

export function savePaletteExportContact(contact) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CONTACT_KEY,
    JSON.stringify({
      firstName: contact.firstName?.trim() || "",
      lastName: contact.lastName?.trim() || "",
      phone: contact.phone?.trim() || "",
      email: contact.email?.trim() || "",
      city: contact.city?.trim() || "",
    })
  );
}

function splitDisplayName(displayName) {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function getDefaultExportContact() {
  const saved = loadPaletteExportContact();
  const premium = loadPremiumProfile();
  const fromName = splitDisplayName(premium.displayName);

  let email = saved.email;
  if (!email && supabase) {
    const { data } = await supabase.auth.getSession();
    email = data?.session?.user?.email || "";
  }

  return {
    firstName: saved.firstName || fromName.firstName,
    lastName: saved.lastName || fromName.lastName,
    phone: saved.phone || premium.phone || "",
    email,
    city: saved.city || premium.address || "",
  };
}

export function hasExportContactInfo(contact) {
  return Boolean(
    contact?.firstName?.trim() ||
      contact?.lastName?.trim() ||
      contact?.phone?.trim() ||
      contact?.email?.trim() ||
      contact?.city?.trim()
  );
}
