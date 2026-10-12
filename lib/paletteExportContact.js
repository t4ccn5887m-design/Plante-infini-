import { clientContactForExport, loadClientContact } from "@/lib/clientContact";

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

export async function getDefaultExportContact() {
  const saved = loadPaletteExportContact();
  const profile = await loadClientContact();
  const fromProfile = clientContactForExport(profile);

  return {
    firstName: saved.firstName || fromProfile.firstName,
    lastName: saved.lastName || fromProfile.lastName,
    phone: saved.phone || fromProfile.phone,
    email: saved.email || fromProfile.email,
    city: saved.city || fromProfile.city,
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
