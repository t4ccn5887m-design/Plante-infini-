/**
 * API côté paysagiste connecté — studio, liens, briefs.
 * RLS : auth.uid() → pro_studios → pro_links / pro_briefs / pro_appointments.
 */
import { supabase } from "@/lib/supabase";
import { isPermanentAuthUser } from "@/lib/authUser";
import { getCloudSession } from "@/lib/cloudSync";
import { PRO_BRIEF_PHOTOS_BUCKET } from "@/lib/pro/clientBriefApi";
import {
  deriveTasteProfile,
  plantTags,
  tasteSummary,
} from "@/lib/pro/briefDerive";

function mapStudio(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id,
    proUserId: row.pro_user_id,
    name: String(row.name || "Mon studio"),
    contactFirstName: String(row.contact_first_name || ""),
    initials: String(row.initials || "?"),
    color: String(row.color || "#2F5E3F"),
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    interventionZone: row.intervention_zone
      ? String(row.intervention_zone)
      : null,
    contactEmail: row.contact_email ? String(row.contact_email) : "",
  };
}

function pickBrief(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] || null;
  return raw;
}

function formatShortDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function dayKey(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function dayLabel(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const label = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return "";
  }
}

function pickAppointments(raw) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/** Statut UI : rdv (filled + RDV) | ready (filled) | wait */
export function deriveUiStatus(linkStatus, hasAppointment) {
  if (linkStatus === "filled" && hasAppointment) return "rdv";
  if (linkStatus === "filled") return "ready";
  return "wait";
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "WP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function studioDefaultsFromUser(user) {
  const email = user?.email || "";
  const local = email.includes("@") ? email.split("@")[0] : "Studio";
  const pretty =
    local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || "Mon studio";
  const first = pretty.split(/\s+/)[0] || "Pro";
  return {
    name: pretty.length > 40 ? "Mon studio" : pretty,
    contact_first_name: first,
    initials: initialsFromName(pretty),
    color: "#2F5E3F",
  };
}

function generateLinkToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

/**
 * Session permanente requise pour /pro.
 * @returns {{ ok: true, user } | { ok: false, error: string }}
 */
export async function getProAuthUser() {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  try {
    const session = await getCloudSession();
    const user = session?.user || null;
    if (!isPermanentAuthUser(user)) {
      return { ok: false, error: "not_authenticated" };
    }
    return { ok: true, user };
  } catch (e) {
    console.error("[Wilder Pro] getProAuthUser:", e);
    return { ok: false, error: "cloud_unavailable" };
  }
}

/**
 * Charge le studio du pro, ou le crée (UPSERT on pro_user_id).
 * @returns {{ ok: true, studio } | { ok: false, error: string }}
 */
export async function ensureProStudio() {
  const auth = await getProAuthUser();
  if (!auth.ok) return auth;
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const userId = auth.user.id;

  try {
    const { data: existing, error: selErr } = await supabase
      .from("pro_studios")
      .select("*")
      .eq("pro_user_id", userId)
      .maybeSingle();

    if (selErr) {
      console.error("[Wilder Pro] select studio:", selErr.message);
      return { ok: false, error: "studio_load_failed" };
    }

    if (existing) {
      return { ok: true, studio: mapStudio(existing) };
    }

    const defaults = studioDefaultsFromUser(auth.user);
    const { data: upserted, error: upErr } = await supabase
      .from("pro_studios")
      .upsert(
        {
          pro_user_id: userId,
          name: defaults.name,
          contact_first_name: defaults.contact_first_name,
          initials: defaults.initials,
          color: defaults.color,
          contact_email: auth.user.email || null,
        },
        { onConflict: "pro_user_id" }
      )
      .select("*")
      .single();

    if (upErr) {
      console.error("[Wilder Pro] upsert studio:", upErr.message);
      // Race : un autre onglet a pu créer — re-select
      const { data: again, error: againErr } = await supabase
        .from("pro_studios")
        .select("*")
        .eq("pro_user_id", userId)
        .maybeSingle();
      if (again && !againErr) {
        return { ok: true, studio: mapStudio(again) };
      }
      return { ok: false, error: "studio_create_failed" };
    }

    return { ok: true, studio: mapStudio(upserted) };
  } catch (e) {
    console.error("[Wilder Pro] ensureProStudio:", e);
    return { ok: false, error: "cloud_unavailable" };
  }
}

/**
 * Met à jour le studio du pro connecté.
 * @returns {{ ok: true, studio } | { ok: false, error: string }}
 */
export async function updateProStudio(studioId, fields) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!studioId) return { ok: false, error: "studio_missing" };

  const name = String(fields?.name || "").trim();
  if (!name) return { ok: false, error: "studio_name_required" };

  const patch = {
    name,
    contact_first_name: String(fields?.contactFirstName || "").trim(),
    initials: String(fields?.initials || "").trim().slice(0, 4) || "?",
    color: String(fields?.color || "#2F5E3F").trim() || "#2F5E3F",
    intervention_zone: String(fields?.interventionZone || "").trim() || null,
    contact_email: String(fields?.contactEmail || "").trim() || null,
  };

  try {
    const { data, error } = await supabase
      .from("pro_studios")
      .update(patch)
      .eq("id", studioId)
      .select("*")
      .single();

    if (error) {
      console.error("[Wilder Pro] updateProStudio:", error.message);
      return { ok: false, error: "studio_update_failed" };
    }

    return { ok: true, studio: mapStudio(data) };
  } catch (e) {
    console.error("[Wilder Pro] updateProStudio:", e);
    return { ok: false, error: "studio_update_failed" };
  }
}

/**
 * Crée un lien client.
 * @returns {{ ok: true, link: { id, token, clientName, url } } | { ok: false, error: string }}
 */
export async function createProLink(studioId, { clientName, clientPhone, clientAddress }) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  const name = String(clientName || "").trim();
  if (!name) return { ok: false, error: "client_name_required" };
  if (!studioId) return { ok: false, error: "studio_missing" };

  const token = generateLinkToken();
  if (!token || token.length < 8) {
    return { ok: false, error: "token_failed" };
  }

  try {
    const { data, error } = await supabase
      .from("pro_links")
      .insert({
        studio_id: studioId,
        token,
        client_name: name,
        client_phone: clientPhone ? String(clientPhone).trim() || null : null,
        client_address: clientAddress
          ? String(clientAddress).trim() || null
          : null,
        status: "sent",
      })
      .select("id, token, client_name, status, created_at")
      .single();

    if (error) {
      console.error("[Wilder Pro] createProLink:", error.message);
      return { ok: false, error: "link_create_failed" };
    }

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    return {
      ok: true,
      link: {
        id: data.id,
        token: data.token,
        clientName: data.client_name,
        status: data.status,
        url: origin ? `${origin}/b/${data.token}` : `/b/${data.token}`,
      },
    };
  } catch (e) {
    console.error("[Wilder Pro] createProLink:", e);
    return { ok: false, error: "link_create_failed" };
  }
}

/**
 * Liste liens + briefs du studio, tri created_at desc.
 * @returns {{ ok: true, items: ProBriefCard[] } | { ok: false, error: string }}
 */
export async function listProLinksWithBriefs(studioId) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!studioId) return { ok: false, error: "studio_missing" };

  try {
    const { data, error } = await supabase
      .from("pro_links")
      .select(
        `
        id,
        token,
        client_name,
        client_phone,
        client_address,
        status,
        created_at,
        opened_at,
        filled_at,
        pro_briefs (
          id,
          tastes,
          plants,
          materials,
          priorities,
          garden_users,
          maintenance,
          photo_urls,
          budget,
          message,
          submitted_at
        ),
        pro_appointments (
          id,
          starts_at
        )
      `
      )
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Wilder Pro] listProLinks:", error.message);
      return { ok: false, error: "links_load_failed" };
    }

    const items = (data || []).map((row) => {
      const brief = pickBrief(row.pro_briefs);
      const appointments = pickAppointments(row.pro_appointments);
      const hasAppointment = appointments.length > 0;
      const uiStatus = deriveUiStatus(row.status, hasAppointment);
      return {
        id: row.id,
        token: row.token,
        name: row.client_name || "Client",
        phone: row.client_phone || "",
        address: row.client_address || "",
        city: extractCity(row.client_address),
        date: formatShortDate(row.filled_at || row.created_at),
        status: uiStatus,
        linkStatus: row.status,
        hasAppointment,
        nextAppointmentAt: hasAppointment
          ? appointments
              .map((a) => a.starts_at)
              .filter(Boolean)
              .sort()[0] || null
          : null,
        budget: brief?.budget
          ? tasteBudgetLabel(brief.budget)
          : "—",
        taste: tasteSummary(brief),
        tags: plantTags(brief),
        brief: brief || null,
        filledAt: row.filled_at,
        createdAt: row.created_at,
        openedAt: row.opened_at,
      };
    });

    return { ok: true, items };
  } catch (e) {
    console.error("[Wilder Pro] listProLinks:", e);
    return { ok: false, error: "links_load_failed" };
  }
}

/**
 * Crée un RDV pour un lien client.
 * @returns {{ ok: true, appointment } | { ok: false, error: string }}
 */
export async function createProAppointment({
  studioId,
  linkId,
  startsAt,
  durationMin = 60,
  notes = "",
}) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!studioId) return { ok: false, error: "studio_missing" };
  if (!linkId) return { ok: false, error: "link_missing" };
  if (!startsAt) return { ok: false, error: "starts_at_required" };

  const duration = Number(durationMin) || 60;
  if (duration <= 0 || duration > 24 * 60) {
    return { ok: false, error: "duration_invalid" };
  }

  try {
    const { data, error } = await supabase
      .from("pro_appointments")
      .insert({
        studio_id: studioId,
        link_id: linkId,
        starts_at: startsAt,
        duration_min: duration,
        notes: typeof notes === "string" ? notes.trim() : "",
      })
      .select("id, studio_id, link_id, starts_at, duration_min, notes, created_at")
      .single();

    if (error) {
      console.error("[Wilder Pro] createAppointment:", error.message);
      return { ok: false, error: "appointment_create_failed" };
    }

    return {
      ok: true,
      appointment: {
        id: data.id,
        studioId: data.studio_id,
        linkId: data.link_id,
        startsAt: data.starts_at,
        durationMin: data.duration_min,
        notes: data.notes || "",
        createdAt: data.created_at,
      },
    };
  } catch (e) {
    console.error("[Wilder Pro] createAppointment:", e);
    return { ok: false, error: "appointment_create_failed" };
  }
}

/**
 * Liste les RDV du studio, tri starts_at asc, groupés par jour.
 * @returns {{ ok: true, groups: { key, label, items }[] } | { ok: false, error: string }}
 */
export async function listProAppointments(studioId) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!studioId) return { ok: false, error: "studio_missing" };

  try {
    const { data, error } = await supabase
      .from("pro_appointments")
      .select(
        `
        id,
        starts_at,
        duration_min,
        notes,
        created_at,
        link_id,
        pro_links (
          id,
          client_name,
          client_phone,
          client_address
        )
      `
      )
      .eq("studio_id", studioId)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[Wilder Pro] listAppointments:", error.message);
      return { ok: false, error: "appointments_load_failed" };
    }

    const items = (data || []).map((row) => {
      const link = pickBrief(row.pro_links);
      return {
        id: row.id,
        linkId: row.link_id,
        startsAt: row.starts_at,
        durationMin: row.duration_min || 60,
        notes: row.notes || "",
        clientName: link?.client_name || "Client",
        phone: link?.client_phone || "",
        address: link?.client_address || "",
        timeLabel: formatTime(row.starts_at),
        dayKey: dayKey(row.starts_at),
        dayLabel: dayLabel(row.starts_at),
        dayNum: (() => {
          try {
            const d = new Date(row.starts_at);
            return Number.isNaN(d.getTime()) ? "" : String(d.getDate());
          } catch {
            return "";
          }
        })(),
        monthShort: (() => {
          try {
            const d = new Date(row.starts_at);
            if (Number.isNaN(d.getTime())) return "";
            return d.toLocaleDateString("fr-FR", { month: "short" });
          } catch {
            return "";
          }
        })(),
      };
    });

    const groupMap = new Map();
    for (const item of items) {
      const key = item.dayKey || "unknown";
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          label: item.dayLabel || "Date inconnue",
          items: [],
        });
      }
      groupMap.get(key).items.push(item);
    }

    return { ok: true, groups: Array.from(groupMap.values()), items };
  } catch (e) {
    console.error("[Wilder Pro] listAppointments:", e);
    return { ok: false, error: "appointments_load_failed" };
  }
}

function extractCity(address) {
  if (!address) return "";
  const s = String(address).trim();
  // "Ville, code" ou dernière partie après virgule
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1].replace(/^\d+\s*/, "") || parts[0];
  return s.length > 32 ? `${s.slice(0, 30)}…` : s;
}

function tasteBudgetLabel(id) {
  const map = {
    lt3: "< 3 k€",
    "3-5": "3–5 k€",
    "5-10": "5–10 k€",
    "10-20": "10–20 k€",
    "20+": "20 k€ +",
    unknown: "—",
  };
  return map[id] || "—";
}

/**
 * URLs signées pour les photos du brief (bucket privé).
 * @returns {string[]}
 */
export async function getBriefPhotoSignedUrls(paths) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [];
  if (!list.length || !supabase) return [];

  try {
    const { data, error } = await supabase.storage
      .from(PRO_BRIEF_PHOTOS_BUCKET)
      .createSignedUrls(list, 60 * 60);

    if (error) {
      console.error("[Wilder Pro] signedUrls:", error.message);
      return [];
    }
    return (data || [])
      .map((row) => row?.signedUrl)
      .filter((u) => typeof u === "string" && u.length > 0);
  } catch (e) {
    console.error("[Wilder Pro] signedUrls:", e);
    return [];
  }
}

/**
 * Construit le modèle d’affichage de la fiche brief.
 */
export function buildBriefDetailView(item) {
  if (!item) return null;
  const openable =
    item.linkStatus === "filled" ||
    item.status === "ready" ||
    item.status === "rdv";
  if (!openable) {
    return { ...item, detail: null, unavailable: false, waiting: true };
  }
  if (!item.brief) {
    return { ...item, detail: null, unavailable: true, waiting: false };
  }

  const profile = deriveTasteProfile(item.brief);
  return {
    ...item,
    detail: profile,
    unavailable: false,
    waiting: false,
  };
}

export function proStudioErrorMessage(code) {
  switch (code) {
    case "cloud_unavailable":
      return "Service indisponible. Vérifiez votre connexion et réessayez.";
    case "not_authenticated":
      return "Connectez-vous pour accéder à Wilder Pro.";
    case "studio_load_failed":
    case "studio_create_failed":
      return "Impossible de charger votre studio. Réessayez.";
    case "studio_missing":
      return "Studio introuvable. Rechargez la page.";
    case "studio_name_required":
      return "Indiquez le nom du studio.";
    case "studio_update_failed":
      return "Impossible d’enregistrer les réglages. Réessayez.";
    case "client_name_required":
      return "Indiquez le nom du client.";
    case "link_create_failed":
    case "token_failed":
      return "Impossible de créer le lien. Réessayez.";
    case "links_load_failed":
      return "Impossible de charger vos briefs. Réessayez.";
    case "link_missing":
      return "Lien client introuvable.";
    case "starts_at_required":
      return "Choisissez une date et une heure.";
    case "duration_invalid":
      return "Durée invalide.";
    case "appointment_create_failed":
      return "Impossible d’enregistrer le rendez-vous. Réessayez.";
    case "appointments_load_failed":
      return "Impossible de charger l’agenda. Réessayez.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}
