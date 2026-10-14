import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Camera,
  FileText,
  LayoutGrid,
  CalendarDays,
  User,
  Users,
  Phone,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowLeft,
  AlertTriangle,
  Download,
  Leaf,
  Sparkles,
  Clock,
  Copy,
  Check,
  Images,
  Trash2,
  Pencil,
  X,
  Bell,
  Heart,
  SlidersHorizontal,
} from "lucide-react";
import { PARTNERS_LIVE } from "@/lib/partnersPreview";
import {
  bucketActivityHint,
  bucketCounts,
  buildProNotificationEvents,
  CLIENT_FILTERS,
  filterByListCategory,
  filterMesClients,
  formatAppointmentBlock,
  formatTodayHeader,
  pickNextAppointment,
} from "@/lib/pro/proLinkBuckets";
import { signOutCloud } from "@/lib/cloudSync";
import BriefDetailScreen from "@/components/pro/BriefDetailScreen";
import {
  createProAppointment,
  updateProAppointment,
  createProLink,
  ensureProStudio,
  getBriefPhotoSignedUrls,
  getProAuthUser,
  listProAppointments,
  listProLinksWithBriefs,
  proStudioErrorMessage,
  updateProStudio,
} from "@/lib/pro/proStudioApi";
import {
  createProProject,
  deleteProProject,
  deleteProjectPhoto,
  getProjectPhotoSignedUrls,
  listProProjects,
  proProjectsErrorMessage,
  updateProProject,
  uploadProjectPhotos,
} from "@/lib/pro/proProjectsApi";
import { isUrgentBrief } from "@/lib/pro/briefDerive";
import { PRO_REALISATION_STYLE_OPTIONS } from "@/lib/pro/realisationStyles";
import {
  buildRdvConfirmationSmsBody,
  rdvConfirmationSmsHref,
} from "@/lib/pro/appointmentSms";
import {
  buildSingleAppointmentIcs,
  downloadAppointmentIcs,
  mapsItineraryUrl,
} from "@/lib/pro/appointmentIcs";
import {
  clientAvailabilityFromBrief,
  isoToPlanDateTime,
  nextPlanDayOptions,
  PLAN_TIME_SLOTS,
  RDV_DURATION_MIN,
} from "@/lib/pro/planRdvUi";

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === "undefined") {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** Image signed URL — vignette vide si URL absente ou illisible. */
function SafePhoto({ src, alt = "", className = "" }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <div className={`wp-photo-fallback ${className}`} aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

/* ============================================================
   WILDER PRO — branché Supabase (étape C)
   Styles : styles/pro/wilder-pro.css (préfixe .wp)
   ============================================================ */

const ST = {
  ready: { c: "ready", l: "Brief prêt" },
  rdv: { c: "rdv", l: "RDV planifié" },
  wait: { c: "wait", l: "En attente" },
};

const STUDIO_COLORS = ["#2F5E3F", "#7A67A6", "#B47327", "#2F5A6E", "#7A2E3F"];

function StudioAvatar({ studio, onOpen }) {
  return (
    <button
      type="button"
      className="ava ava-btn"
      onClick={onOpen}
      aria-label="Ouvrir les réglages"
      title="Réglages"
    >
      {studio?.initials || "?"}
    </button>
  );
}

function ProDesktopSidebar({
  tab,
  studio,
  onNavProjets,
  onNavAgenda,
  onNavRealisations,
  onNavStudio,
  onSendLink,
}) {
  const realisationsOn =
    tab === "realisations" ||
    tab === "realisation-detail" ||
    tab === "realisation-form";
  const projetsOn =
    tab === "projets" ||
    tab === "clients" ||
    tab === "detail" ||
    tab === "notifs";

  return (
    <aside className="wp-sidebar no-print" aria-label="Navigation principale">
      <div className="wp-sidebar-brand">
        <Leaf size={20} strokeWidth={2.2} aria-hidden />
        <span className="wp-sidebar-logo">sevya</span>
        <span className="wp-sidebar-pro">PRO</span>
      </div>

      <button
        type="button"
        className="wp-sidebar-send"
        onClick={onSendLink}
      >
        <Send size={18} aria-hidden />
        Envoyer un lien
      </button>

      <nav className="wp-sidebar-nav" aria-label="Sections">
        <button
          type="button"
          className={`wp-sidebar-link${projetsOn ? " on" : ""}`}
          onClick={onNavProjets}
        >
          <LayoutGrid size={20} aria-hidden />
          Projets
        </button>
        <button
          type="button"
          className={`wp-sidebar-link${tab === "agenda" ? " on" : ""}`}
          onClick={onNavAgenda}
        >
          <CalendarDays size={20} aria-hidden />
          Agenda
        </button>
        <button
          type="button"
          className={`wp-sidebar-link${realisationsOn ? " on" : ""}`}
          onClick={onNavRealisations}
        >
          <Images size={20} aria-hidden />
          Réalisations
        </button>
        <button
          type="button"
          className={`wp-sidebar-link${tab === "studio" ? " on" : ""}`}
          onClick={onNavStudio}
        >
          <SlidersHorizontal size={20} aria-hidden />
          Studio
        </button>
      </nav>

      <button type="button" className="wp-sidebar-footer" onClick={onNavStudio}>
        <span className="wp-sidebar-footer-ava">{studio?.initials || "?"}</span>
        <span className="wp-sidebar-footer-text">
          <span className="wp-sidebar-footer-name">
            {studio?.name || "Mon studio"}
          </span>
          <span className="wp-sidebar-footer-sub">Studio</span>
        </span>
      </button>
    </aside>
  );
}

function BriefListThumb({ paths }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const path = paths?.[0];
    if (!path) {
      setSrc(null);
      return undefined;
    }
    getBriefPhotoSignedUrls([path]).then((urls) => {
      if (!cancelled && urls[0]) setSrc(urls[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [paths]);

  if (src) {
    return <img className="bc-thumb" src={src} alt="" />;
  }
  return <div className="bc-thumb-ph" aria-hidden />;
}

function BriefCard({ b, onOpen }) {
  const s = ST[b.status] || ST.wait;
  const tap = b.status === "ready" || b.status === "rdv";
  const sub =
    tap && b.taste
      ? b.taste
      : b.linkStatus === "opened"
        ? "Ouvert — pas encore rempli"
        : b.taste || "Pas encore rempli";
  return (
    <button
      className={`bcard ${tap ? "tap" : "wait"}`}
      onClick={() => tap && onOpen(b)}
      type="button"
    >
      <BriefListThumb paths={b.brief?.photo_urls} />
      <div className="bc-main">
        <div className="bc-name">{b.name}</div>
        <div className="bc-taste">
          {[b.city, sub].filter(Boolean).join(" · ")}
        </div>
      </div>
      <span className={`status ${s.c}`}>{s.l}</span>
    </button>
  );
}

const LIST_META = {
  demandes: {
    title: "Demandes",
    sub: "Ces particuliers ont choisi votre studio. Leur dossier est déjà rempli.",
  },
  ready: {
    title: "Briefs prêts",
    sub: "À lire avant le premier rendez-vous.",
  },
  wait: {
    title: "En attente",
    sub: "Liens envoyés, pas encore remplis.",
  },
  clients: {
    title: "Mes clients",
    sub: "",
  },
};

function ProjetsHome({
  studio,
  items,
  linksStatus,
  linksError,
  onRetryLinks,
  onSend,
  onOpenList,
  onOpenNotifs,
  onOpenSettings,
  onOpen,
  notifCount,
}) {
  const counts = bucketCounts(items);
  const next = pickNextAppointment(items);
  const rdvFmt = next ? formatAppointmentBlock(next.nextAppointmentAt) : null;
  const firstName =
    studio?.contactFirstName?.trim() ||
    studio?.name?.trim()?.split(/\s+/)[0] ||
    "Bonjour";

  const buckets = [
    ...(PARTNERS_LIVE
      ? [
          {
            key: "demandes",
            label: "Demandes",
            icon: Heart,
            color: "#DB7E44",
            hot: counts.demandes > 0,
          },
        ]
      : []),
    {
      key: "ready",
      label: "Briefs prêts",
      icon: FileText,
      color: "#4E7B52",
      hot: false,
    },
    {
      key: "wait",
      label: "En attente",
      icon: Clock,
      color: "#8B9088",
      hot: false,
    },
    {
      key: "clients",
      label: "Mes clients",
      icon: Users,
      color: "#8B9088",
      hot: false,
    },
  ];

  return (
    <div className="card-panel">
      <div className="wp-pro-top">
        <div className="wp-pro-brand">
          Sevya<span>PRO</span>
        </div>
        <div className="wp-pro-top-actions">
          <button
            type="button"
            className="wp-icon-btn"
            onClick={onOpenNotifs}
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={1.5} />
            {notifCount > 0 && (
              <span className="wp-notif-dot" aria-hidden>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          <StudioAvatar studio={studio} onOpen={onOpenSettings} />
        </div>
      </div>

      <div className="wp-pro-greet-k">{formatTodayHeader()}</div>
      <div className="wp-pro-greet-h">Bonjour {firstName}.</div>

      {linksStatus === "loading" && (
        <p className="bc-taste" style={{ marginTop: 18 }}>
          Chargement de vos projets…
        </p>
      )}

      {linksStatus === "error" && (
        <div className="wp-empty" style={{ marginTop: 8 }}>
          <p className="wp-empty-title">Impossible de charger vos projets</p>
          <p className="wp-empty-sub">
            {linksError ||
              "Une erreur est survenue. Réessayez dans un instant."}
          </p>
          <button className="linebtn" type="button" onClick={onRetryLinks}>
            Réessayer
          </button>
        </div>
      )}

      {linksStatus === "ready" && next && rdvFmt && (
        <div className="wp-pro-next">
          <div className="wp-pro-next-k">Prochain rendez-vous</div>
          <button
            type="button"
            className="wp-pro-next-row"
            onClick={() => onOpen(next)}
          >
            <div>
              <div className="wp-pro-next-when">
                {rdvFmt.line1} · {rdvFmt.line2}
              </div>
              <div className="wp-pro-next-who">
                {next.name}{" "}
                <span className="wp-pro-next-meta">· {next.city || next.address}</span>
              </div>
            </div>
            <span className="wp-pro-next-link">Relire le brief ›</span>
          </button>
        </div>
      )}

      <div className="wp-pro-send">
        <button className="bigbtn" type="button" onClick={onSend}>
          <Send size={18} /> Envoyer un lien à un client
        </button>
      </div>

      {linksStatus === "ready" && (
        <div className="wp-bucket-grid">
          {buckets.map(({ key, label, icon: Icon, color, hot }) => {
            const n = counts[key] ?? 0;
            return (
              <button
                key={key}
                type="button"
                className={`wp-bucket-card${hot ? " hot" : ""}`}
                onClick={() => onOpenList(key)}
              >
                <div className="wp-bucket-top">
                  <Icon size={22} color={color} strokeWidth={1.5} />
                  <span className="wp-bucket-n">{n}</span>
                </div>
                <div>
                  <div className="wp-bucket-title">{label}</div>
                  <div
                    className={`wp-bucket-sub${hot ? " hot" : ""}`}
                  >
                    {bucketActivityHint(items, key)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotifsScreen({ items, onBack, onOpenItem }) {
  const events = buildProNotificationEvents(items);

  return (
    <div className="card-panel">
      <button type="button" className="back" onClick={onBack}>
        <ArrowLeft size={18} /> Projets
      </button>
      <div className="h-title" style={{ fontWeight: 300, marginTop: 4 }}>
        Du nouveau
      </div>
      {events.length === 0 ? (
        <div className="wp-empty" style={{ marginTop: 24 }}>
          <p className="wp-empty-title">Rien pour le moment</p>
          <p className="wp-empty-sub">
            Les ouvertures de lien et briefs remplis apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="wp-notif-list">
          {events.map((ev) => (
            <button
              key={ev.id}
              type="button"
              className="wp-notif-row"
              onClick={() => onOpenItem(ev.itemId, ev.kind)}
            >
              <span className="wp-notif-body">
                <span
                  className={`wp-notif-pip${
                    ev.kind === "opened" ? " open" : ""
                  }`}
                  aria-hidden
                />
                <span>
                  <span className="wp-notif-text">{ev.title}</span>
                  <span className="wp-notif-when">{ev.when}</span>
                </span>
              </span>
              <ChevronRight size={18} color="#8B9088" />
            </button>
          ))}
        </div>
      )}
      <p className="bc-taste" style={{ marginTop: 20 }}>
        E-mail et notifications push : bientôt disponibles.
      </p>
    </div>
  );
}

function ClientList({
  category,
  items,
  linksStatus,
  linksError,
  onRetryLinks,
  onBack,
  onOpen,
  onSend,
}) {
  const meta = LIST_META[category] || LIST_META.clients;
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState(CLIENT_FILTERS.cours);

  let shown = [];
  if (category === "clients") {
    shown = filterMesClients(items, { query, filter: clientFilter });
  } else {
    shown = filterByListCategory(items, category);
  }
  shown = [...shown].sort((a, b) => {
    const ua = isUrgentBrief(a.brief) ? 0 : 1;
    const ub = isUrgentBrief(b.brief) ? 0 : 1;
    return ua - ub;
  });

  return (
    <div className="card-panel">
      <button type="button" className="back" onClick={onBack}>
        <ArrowLeft size={18} /> Projets
      </button>
      <div className="h-title" style={{ fontWeight: 300, marginTop: 4 }}>
        {meta.title}
      </div>
      {meta.sub ? (
        <p className="bc-taste" style={{ marginTop: 6 }}>
          {meta.sub}
        </p>
      ) : null}

      {linksStatus === "loading" && (
        <p className="bc-taste" style={{ marginTop: 18 }}>
          Chargement…
        </p>
      )}

      {linksStatus === "error" && (
        <div className="wp-empty" style={{ marginTop: 18 }}>
          <p className="wp-empty-title">Impossible de charger la liste</p>
          <p className="wp-empty-sub">{linksError}</p>
          <button className="linebtn" type="button" onClick={onRetryLinks}>
            Réessayer
          </button>
        </div>
      )}

      {linksStatus === "ready" && category === "clients" && (
        <>
          <div className="wp-client-search">
            <input
              type="search"
              placeholder="Rechercher un client"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="wp-client-filters">
            {[
              [CLIENT_FILTERS.cours, "En cours"],
              [CLIENT_FILTERS.won, "Gagnés"],
              [CLIENT_FILTERS.lost, "Perdus"],
              [CLIENT_FILTERS.arch, "Archivés"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`fp ${clientFilter === key ? "on" : ""}`}
                onClick={() => setClientFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {linksStatus === "ready" &&
        (shown.length === 0 ? (
          <div className="wp-empty" style={{ marginTop: 18 }}>
            <p className="wp-empty-title">Rien pour le moment</p>
            {category === "wait" && (
              <button className="bigbtn" type="button" onClick={onSend}>
                <Send size={18} /> Envoyer un lien
              </button>
            )}
          </div>
        ) : (
          <div className="blist" style={{ marginTop: 12 }}>
            {shown.map((b) => (
              <BriefCard key={b.id} b={b} onOpen={onOpen} />
            ))}
          </div>
        ))}
    </div>
  );
}

function StudioScreen({ studio, onOpenSettings }) {
  const contact = studio?.contactFirstName?.trim();
  const zone = studio?.interventionZone?.trim();
  const years =
    studio?.yearsExperience != null && studio.yearsExperience > 0
      ? `${studio.yearsExperience} ans d’expérience`
      : null;
  const specs = (studio?.specialties || []).filter(Boolean);

  return (
    <div className="card-panel">
      <div className="head-row">
        <div className="h-title" style={{ fontSize: 26 }}>
          Studio
        </div>
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
      </div>
      <div className="wp-studio-head">
        <span className="wp-studio-logo">{studio?.initials || "?"}</span>
        <div>
          <div className="wp-studio-name">{studio?.name || "Mon studio"}</div>
          <div className="wp-studio-sub">
            {[contact, zone, years].filter(Boolean).join(" · ") ||
              "Présentation et réglages"}
          </div>
        </div>
      </div>
      {studio?.presentation ? (
        <p className="bc-taste" style={{ marginTop: 16, lineHeight: 1.55 }}>
          {studio.presentation}
        </p>
      ) : null}
      {specs.length > 0 ? (
        <div className="chipwrap" style={{ marginTop: 12 }}>
          {specs.map((s) => (
            <span className="vchip" key={s}>
              {s}
            </span>
          ))}
        </div>
      ) : null}
      <button
        className="bigbtn"
        type="button"
        style={{ marginTop: 22 }}
        onClick={onOpenSettings}
      >
        <SlidersHorizontal size={18} /> Réglages du studio
      </button>
      <p className="bc-taste" style={{ marginTop: 14 }}>
        Aperçu fiche Partenaires et abonnement : prochaines étapes.
      </p>
    </div>
  );
}

function Realisations({ studio, refreshKey, onOpen, onCreate, onOpenSettings }) {
  const [items, setItems] = useState([]);
  const [coverUrls, setCoverUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studio?.id) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const result = await listProProjects(studio.id);
      if (cancelled) return;
      if (!result.ok) {
        setLoading(false);
        setError(proProjectsErrorMessage(result.error, result.detail));
        // Keep previous items if any — avoid fake empty on refresh failure
        return;
      }
      setItems(result.items || []);
      setLoading(false);

      const paths = (result.items || [])
        .map((p) => p.coverPath)
        .filter(Boolean);
      if (!paths.length) {
        setCoverUrls({});
        return;
      }
      const urls = await getProjectPhotoSignedUrls(paths);
      if (cancelled) return;
      const map = {};
      (result.items || []).forEach((p) => {
        if (!p.coverPath) return;
        const idx = paths.indexOf(p.coverPath);
        if (idx >= 0 && urls[idx]) map[p.id] = urls[idx];
      });
      setCoverUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [studio?.id, refreshKey, retryTick]);

  const empty = !loading && !error && items.length === 0;

  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Réalisations</div>
          <div className="h-sub">
            {loading
              ? "Chargement…"
              : error
                ? "Chargement interrompu"
                : empty
                  ? "Aucun dossier"
                  : `${items.length} réalisation${items.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
      </div>

      {loading && (
        <p className="bc-taste" style={{ marginTop: 18 }}>
          Chargement des réalisations…
        </p>
      )}

      {error && (
        <div className="wp-empty" style={{ marginTop: 18 }}>
          <p className="wp-empty-title">Impossible de charger vos réalisations</p>
          <p className="wp-empty-sub">{error}</p>
          <button
            className="linebtn"
            type="button"
            onClick={() => setRetryTick((t) => t + 1)}
          >
            Réessayer
          </button>
        </div>
      )}

      {empty && (
        <div className="wp-empty" style={{ marginTop: 18 }}>
          <Images size={28} color="#4E7B52" />
          <p className="wp-empty-title">Créez votre première réalisation</p>
          <p className="wp-empty-sub">
            Constituez un dossier photo pour montrer un jardin déjà réalisé.
          </p>
          <button className="bigbtn" type="button" onClick={onCreate}>
            <Plus size={18} /> Nouvelle réalisation
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <button
            className="bigbtn"
            type="button"
            onClick={onCreate}
            style={{ marginTop: 14, marginBottom: 4 }}
          >
            <Plus size={18} /> Nouvelle réalisation
          </button>
          <div className="wp-proj-grid">
            {items.map((p) => (
              <button
                key={p.id}
                type="button"
                className="wp-proj-card"
                onClick={() => onOpen(p)}
              >
                <div className="wp-proj-thumb">
                  <SafePhoto src={coverUrls[p.id]} alt="" />
                </div>
                <div className="wp-proj-meta">
                  <div className="wp-proj-title">
                    {p.title}
                    {!p.isPublic ? (
                      <span className="wp-proj-badge-private">Privée</span>
                    ) : null}
                  </div>
                  <div className="wp-proj-loc">
                    {p.location ? (
                      <>
                        <MapPin size={13} /> {p.location}
                      </>
                    ) : (
                      "Sans lieu"
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RealisationDetail({
  project,
  studio,
  onBack,
  onEdit,
  onDeleted,
  onOpenSettings,
  onProjectChange,
}) {
  const [photoUrls, setPhotoUrls] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const addPhotoInputRef = useRef(null);
  const photos = project?.photos || [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const paths = photos.map((p) => p.path).filter(Boolean);
      if (!paths.length) {
        setPhotoUrls([]);
        return;
      }
      const urls = await getProjectPhotoSignedUrls(paths);
      if (!cancelled) setPhotoUrls(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id, project?.photos]);

  const removePhoto = async (photo) => {
    if (!photo || busy) return;
    if (!window.confirm("Supprimer cette photo ?")) return;
    setBusy(true);
    setError(null);
    const result = await deleteProjectPhoto(photo);
    setBusy(false);
    if (!result.ok) {
      setError(proProjectsErrorMessage(result.error));
      return;
    }
    const next = {
      ...project,
      photos: photos.filter((p) => p.id !== photo.id),
      coverPath:
        photos.filter((p) => p.id !== photo.id)[0]?.path || null,
    };
    onProjectChange?.(next);
  };

  const onAddPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !project?.id || !studio?.id || uploading) return;
    setError(null);
    setUploading(true);
    const dataUrls = [];
    for (let i = 0; i < files.length; i += 1) {
      const dataUrl = await readFileAsDataUrl(files[i]);
      if (dataUrl) dataUrls.push(dataUrl);
    }
    if (!dataUrls.length) {
      setUploading(false);
      setError("Aucune photo n’a pu être lue. Essayez JPEG ou PNG.");
      return;
    }
    const up = await uploadProjectPhotos({
      studioId: studio.id,
      projectId: project.id,
      photoDataUrls: dataUrls,
      startSort: photos.length,
    });
    setUploading(false);
    if (!up.ok && !(up.photos || []).length) {
      setError(proProjectsErrorMessage(up.error));
      return;
    }
    if (up.failures > 0) {
      setError(
        `${up.failures} photo${up.failures > 1 ? "s" : ""} n’ont pas pu être ajoutées.`
      );
    }
    onProjectChange?.({
      ...project,
      photos: [...photos, ...(up.photos || [])],
      coverPath: project.coverPath || up.photos?.[0]?.path || null,
    });
  };

  const removeProject = async () => {
    if (busy) return;
    if (
      !window.confirm(
        "Supprimer ce dossier et toutes ses photos ? Cette action est définitive."
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await deleteProProject(project);
    setBusy(false);
    if (!result.ok) {
      setError(proProjectsErrorMessage(result.error));
      return;
    }
    onDeleted?.();
  };

  return (
    <div className="card-panel">
      <div className="head-row">
        <button className="back" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Réalisations
        </button>
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
      </div>

      <div className="dhero" style={{ marginTop: 4 }}>
        <div className="who">
          {project?.title}
          {!project?.isPublic ? (
            <span className="wp-proj-badge-private">Privée</span>
          ) : null}
        </div>
        {project?.style ? (
          <div className="coord">
            <span>{project.style}</span>
          </div>
        ) : null}
        {project?.location ? (
          <div className="coord">
            <span>
              <MapPin size={15} /> {project.location}
            </span>
          </div>
        ) : null}
        <div className="srow no-print" style={{ marginTop: 14, borderBottom: "none" }}>
          <span className="rk" style={{ color: "#CDD9C9" }}>
            Visible dans Partenaires
          </span>
          <span
            className={`toggle ${project?.isPublic !== false ? "on" : ""}`}
            onClick={async () => {
              if (busy || !project?.id) return;
              const next = project.isPublic === false;
              setBusy(true);
              const res = await updateProProject(project.id, { isPublic: next });
              setBusy(false);
              if (res.ok) {
                onProjectChange?.({ ...project, ...res.project, isPublic: next });
              } else {
                setError(proProjectsErrorMessage(res.error));
              }
            }}
            role="switch"
            aria-checked={project?.isPublic !== false}
            tabIndex={0}
          />
        </div>
        <div className="acts no-print">
          <button className="prim" type="button" onClick={onEdit} disabled={busy}>
            <Pencil size={17} /> Modifier
          </button>
          <button
            className="ghost"
            type="button"
            onClick={removeProject}
            disabled={busy}
            style={{ color: "#9B3B2E" }}
          >
            <Trash2 size={17} /> Supprimer
          </button>
        </div>
      </div>

      {project?.description ? (
        <div className="dcard">
          <div className="dlbl">Description</div>
          <p className="bc-taste" style={{ margin: 0 }}>
            {project.description}
          </p>
        </div>
      ) : null}

      <div className="dcard">
        <div className="dlbl">
          <Camera size={14} /> Photos
          {photos.length ? ` · ${photos.length}` : ""}
        </div>
        {photos.length === 0 && !uploading ? (
          <p className="bc-taste">Aucune photo pour l’instant.</p>
        ) : null}
        <div className="wp-proj-gallery">
          {photos.map((photo, i) => (
            <div className="wp-proj-gal-item" key={photo.id}>
              <button
                type="button"
                className="wp-proj-gal-view"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Agrandir la photo ${i + 1}`}
              >
                <SafePhoto src={photoUrls[i]} alt="" />
              </button>
              <button
                type="button"
                className="wp-proj-gal-del"
                onClick={() => removePhoto(photo)}
                disabled={busy}
                aria-label="Supprimer la photo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="wp-proj-gal-add"
            onClick={() => addPhotoInputRef.current?.click()}
            disabled={uploading}
            aria-label="Ajouter une photo"
          >
            {uploading ? <span className="wp-spinner" aria-hidden /> : <Plus size={22} />}
          </button>
        </div>
        <input
          ref={addPhotoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="wp-visually-hidden"
          onChange={onAddPhotos}
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="wp-form-error" role="alert">
          {error}
        </p>
      )}

      {lightboxIndex !== null && (
        <RealisationLightbox
          photos={photoUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

/** Visionneuse plein écran — clic sur une vignette de réalisation. */
function RealisationLightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef(null);
  const count = photos.length;
  const canPrev = index > 0;
  const canNext = index < count - 1;

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => (i < count - 1 ? i + 1 : i));
  }, [count]);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  if (!count) return null;

  return (
    <div className="wp-lightbox" onClick={onClose}>
      <button
        type="button"
        className="wp-lightbox-close"
        onClick={onClose}
        aria-label="Fermer"
      >
        <X size={22} />
      </button>
      <div
        className="wp-lightbox-img-wrap"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <SafePhoto src={photos[index]} alt="" />
      </div>
      {canPrev && (
        <button
          type="button"
          className="wp-lightbox-nav wp-lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Photo précédente"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          className="wp-lightbox-nav wp-lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Photo suivante"
        >
          <ChevronRight size={22} />
        </button>
      )}
      {count > 1 && (
        <div className="wp-lightbox-count">
          {index + 1} / {count}
        </div>
      )}
    </div>
  );
}

function RealisationForm({
  studio,
  project,
  onClose,
  onSaved,
  onOpenSettings,
}) {
  const isEdit = Boolean(project?.id);
  const [title, setTitle] = useState(project?.title || "");
  const [location, setLocation] = useState(project?.location || "");
  const [description, setDescription] = useState(project?.description || "");
  const [style, setStyle] = useState(project?.style || "");
  const [isPublic, setIsPublic] = useState(project?.isPublic !== false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadNote, setUploadNote] = useState(null);

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files].slice(0, 24));
  };

  const removePending = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError(null);
    setUploadNote(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setError(proProjectsErrorMessage("project_title_required"));
      return;
    }
    if (!studio?.id) {
      setError(proProjectsErrorMessage("studio_missing"));
      return;
    }

    setLoading(true);

    let saved = project;
    if (isEdit) {
      const upd = await updateProProject(project.id, {
        title: trimmed,
        location,
        description,
        style,
        isPublic,
      });
      if (!upd.ok) {
        setLoading(false);
        setError(proProjectsErrorMessage(upd.error));
        return;
      }
      saved = { ...project, ...upd.project, photos: project.photos || [] };
    } else {
      const created = await createProProject(studio.id, {
        title: trimmed,
        location,
        description,
        style,
        isPublic,
      });
      if (!created.ok) {
        setLoading(false);
        setError(proProjectsErrorMessage(created.error));
        return;
      }
      saved = created.project;
    }

    if (pendingFiles.length) {
      const dataUrls = [];
      for (let i = 0; i < pendingFiles.length; i += 1) {
        const dataUrl = await readFileAsDataUrl(pendingFiles[i]);
        if (dataUrl) dataUrls.push(dataUrl);
      }

      if (dataUrls.length) {
        const up = await uploadProjectPhotos({
          studioId: studio.id,
          projectId: saved.id,
          photoDataUrls: dataUrls,
          startSort: (saved.photos || []).length,
        });
        if (!up.ok && !(up.photos || []).length) {
          setLoading(false);
          setError(proProjectsErrorMessage(up.error));
          // Dossier créé : on laisse l’utilisateur revenir / réessayer
          onSaved?.(saved);
          return;
        }
        saved = {
          ...saved,
          photos: [...(saved.photos || []), ...(up.photos || [])],
          coverPath:
            saved.coverPath || up.photos?.[0]?.path || null,
        };
        if (up.failures > 0) {
          setUploadNote(
            `${up.failures} photo${up.failures > 1 ? "s" : ""} n’ont pas pu être ajoutées.`
          );
        }
      } else if (pendingFiles.length) {
        setUploadNote("Aucune photo n’a pu être lue. Essayez JPEG ou PNG.");
      }
    }

    setLoading(false);
    onSaved?.(saved);
  };

  return (
    <div className="card-panel">
      <div className="head-row">
        <button className="back" onClick={onClose} type="button">
          <ArrowLeft size={18} /> Annuler
        </button>
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
      </div>

      <div className="h-title" style={{ marginBottom: 14 }}>
        {isEdit ? "Modifier la réalisation" : "Nouvelle réalisation"}
      </div>

      <div className="field">
        <label htmlFor="proj-title">Titre</label>
        <input
          id="proj-title"
          type="text"
          placeholder="Ex. Jardin contemporain — Aix"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="field">
        <label htmlFor="proj-loc">Lieu</label>
        <input
          id="proj-loc"
          type="text"
          placeholder="Ville, quartier…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="field">
        <label htmlFor="proj-desc">Description</label>
        <textarea
          id="proj-desc"
          className="wp-textarea"
          rows={4}
          placeholder="Ambiance, contraintes, matériaux…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="label" style={{ marginTop: 4 }}>
        Style · pour vous la suggérer au bon client
      </div>
      <div className="filters">
        {PRO_REALISATION_STYLE_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={`fp ${style === s ? "on" : ""}`}
            onClick={() => setStyle(s)}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="srow" style={{ marginTop: 16 }}>
        <span className="rk">Visible dans Partenaires</span>
        <span
          className={`toggle ${isPublic ? "on" : ""}`}
          onClick={() => !loading && setIsPublic((v) => !v)}
          role="switch"
          aria-checked={isPublic}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!loading) setIsPublic((v) => !v);
            }
          }}
        />
      </div>
      {!isPublic ? (
        <p className="bc-taste">Badge « Privée » sur cette réalisation.</p>
      ) : null}

      <div className="field">
        <label htmlFor="proj-photos">Photos</label>
        <input
          id="proj-photos"
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          disabled={loading}
        />
        {pendingFiles.length > 0 && (
          <ul className="wp-pending-photos">
            {pendingFiles.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span>{f.name || `Photo ${i + 1}`}</span>
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  disabled={loading}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="wp-form-error" role="alert">
          {error}
        </p>
      )}
      {uploadNote && !error && (
        <p className="wp-form-error" role="status">
          {uploadNote}
        </p>
      )}

      <button
        className="bigbtn"
        type="button"
        onClick={handleSave}
        disabled={loading}
      >
        {loading
          ? "Enregistrement…"
          : isEdit
            ? "Enregistrer"
            : "Créer la réalisation"}
      </button>
      <button className="linebtn" type="button" onClick={onClose} disabled={loading}>
        Annuler
      </button>
    </div>
  );
}

function Agenda({ studio, refreshKey, onOpenSettings, onOpenBrief }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const addToCalendar = (a) => {
    const ics = buildSingleAppointmentIcs({
      id: a.id,
      startsAt: a.startsAt,
      durationMin: a.durationMin,
      clientName: a.clientName,
      studioName: studio?.name,
      address: a.address,
      notes: a.notes,
    });
    const safeName = String(a.clientName || "client")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 24);
    downloadAppointmentIcs(`rdv-${safeName || "sevya"}.ics`, ics);
  };

  const openItinerary = (a) => {
    const url = mapsItineraryUrl(a.address);
    if (url && typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studio?.id) {
        setGroups([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const result = await listProAppointments(studio.id);
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(proStudioErrorMessage(result.error, result.detail));
        setGroups([]);
        return;
      }
      setGroups(result.groups || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [studio?.id, refreshKey, retryTick]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const empty = !loading && !error && groups.length === 0;

  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Rendez-vous</div>
          <div className="h-sub">
            {loading
              ? "Chargement…"
              : error
                ? "Chargement interrompu"
                : empty
                  ? "Aucun rendez-vous"
                  : `${total} planifié${total > 1 ? "s" : ""}`}
          </div>
        </div>
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
      </div>

      {loading && (
        <p className="bc-taste" style={{ marginTop: 18 }}>
          Chargement de l’agenda…
        </p>
      )}

      {error && (
        <div className="wp-empty" style={{ marginTop: 18 }}>
          <p className="wp-empty-title">Impossible de charger l’agenda</p>
          <p className="wp-empty-sub">{error}</p>
          <button
            className="linebtn"
            type="button"
            onClick={() => setRetryTick((t) => t + 1)}
          >
            Réessayer
          </button>
        </div>
      )}

      {empty && (
        <div className="wp-empty" style={{ marginTop: 18 }}>
          <Clock size={28} color="#7A67A6" />
          <p className="wp-empty-title">Aucun rendez-vous planifié</p>
          <p className="wp-empty-sub">
            Ouvrez un brief prêt et appuyez sur Planifier pour ajouter un RDV.
          </p>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {groups.map((group) => (
            <div key={group.key} style={{ marginBottom: 18 }}>
              <div className="label">{group.label}</div>
              {group.items.map((a) => (
                <div className="wp-agenda-block" key={a.id}>
                  <button
                    type="button"
                    className="wp-agenda-row"
                    onClick={() => a.linkId && onOpenBrief?.(a.linkId)}
                  >
                    <div className="when">
                      <div className="d">{a.dayNum}</div>
                      <div className="m">{a.monthShort}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="who2">{a.clientName}</div>
                      <div className="info">
                        {a.timeLabel}
                        {a.durationMin ? ` · ${a.durationMin} min` : ""}
                      </div>
                      {a.address ? (
                        <div className="info" style={{ marginTop: 4 }}>
                          {a.address}
                        </div>
                      ) : null}
                      {a.notes ? (
                        <div className="info" style={{ marginTop: 4 }}>
                          {a.notes}
                        </div>
                      ) : null}
                    </div>
                    {a.linkId ? (
                      <ChevronRight size={20} color="#8B9088" aria-hidden />
                    ) : null}
                  </button>
                  <div className="wp-agenda-actions">
                    <button type="button" onClick={() => addToCalendar(a)}>
                      + Calendrier iPhone
                    </button>
                    <button
                      type="button"
                      onClick={() => openItinerary(a)}
                      disabled={!a.address}
                    >
                      Itinéraire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsSheet({ studio, authEmail, onClose, onSaved, onSignOut }) {
  const [name, setName] = useState(studio?.name || "");
  const [contactFirstName, setContactFirstName] = useState(
    studio?.contactFirstName || ""
  );
  const [initials, setInitials] = useState(studio?.initials || "");
  const [contactEmail, setContactEmail] = useState(
    studio?.contactEmail || authEmail || ""
  );
  const [interventionZone, setInterventionZone] = useState(
    studio?.interventionZone || ""
  );
  const [presentation, setPresentation] = useState(studio?.presentation || "");
  const [yearsExperience, setYearsExperience] = useState(
    studio?.yearsExperience != null ? String(studio.yearsExperience) : ""
  );
  const [specialtiesText, setSpecialtiesText] = useState(
    (studio?.specialties || []).join(", ")
  );
  const [color, setColor] = useState(studio?.color || "#2F5E3F");
  const [tog, setTog] = useState({ a: true, b: true, c: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedOk, setSavedOk] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSavedOk(false);
    setLoading(true);
    const result = await updateProStudio(studio?.id, {
      name,
      contactFirstName,
      initials,
      contactEmail,
      interventionZone,
      presentation,
      yearsExperience,
      specialtiesText,
      color,
    });
    setLoading(false);
    if (!result.ok) {
      setError(proStudioErrorMessage(result.error));
      return;
    }
    onSaved?.(result.studio);
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 2000);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sheet-tall" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>Réglages</h3>
        <p className="lead">Studio visible sur le lien client</p>

        <div className="field">
          <label htmlFor="set-name">Nom du studio</label>
          <input
            id="set-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="set-contact">Prénom / contact</label>
          <input
            id="set-contact"
            type="text"
            value={contactFirstName}
            onChange={(e) => setContactFirstName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="set-initials">Initiales</label>
          <input
            id="set-initials"
            type="text"
            maxLength={4}
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="set-email">E-mail</label>
          <input
            id="set-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={authEmail || "contact@studio.fr"}
          />
        </div>
        <div className="field">
          <label htmlFor="set-zone">Zone d’intervention</label>
          <input
            id="set-zone"
            type="text"
            value={interventionZone}
            onChange={(e) => setInterventionZone(e.target.value)}
            placeholder="Ex. Aix + 30 km"
          />
        </div>
        <div className="field">
          <label htmlFor="set-pres">Présentation</label>
          <textarea
            id="set-pres"
            className="wp-textarea"
            rows={3}
            placeholder="3 lignes sur votre studio…"
            value={presentation}
            onChange={(e) => setPresentation(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="set-spec">Spécialités</label>
          <input
            id="set-spec"
            type="text"
            value={specialtiesText}
            onChange={(e) => setSpecialtiesText(e.target.value)}
            placeholder="Méditerranéen, piscines…"
          />
        </div>
        <div className="field">
          <label htmlFor="set-years">Années d’expérience</label>
          <input
            id="set-years"
            type="number"
            min={0}
            max={80}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="Ex. 12"
          />
        </div>

        <div className="label" style={{ marginTop: 8 }}>
          Lien client
        </div>
        <div className="field">
          <label>Couleur du lien client</label>
          <div className="colorrow" style={{ marginTop: 6 }}>
            {STUDIO_COLORS.map((c) => (
              <span
                key={c}
                className={`csw ${color === c ? "sel" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setColor(c);
                }}
                role="button"
                tabIndex={0}
              />
            ))}
          </div>
          <div className="mini-hero" style={{ background: color, marginTop: 12 }}>
            <div className="k">Préparez votre rendez-vous avec</div>
            <div className="t">{name.trim() || "votre studio"}</div>
          </div>
        </div>

        <div className="dcard" style={{ marginTop: 4 }}>
          <div className="dlbl">Notifications</div>
          <div className="srow">
            <span className="rk">Brief rempli par un client</span>
            <span
              className={`toggle ${tog.a ? "on" : ""}`}
              onClick={() => setTog((s) => ({ ...s, a: !s.a }))}
              role="switch"
              aria-checked={tog.a}
              tabIndex={0}
            />
          </div>
          <div className="srow">
            <span className="rk">Lien ouvert par le client</span>
            <span
              className={`toggle ${tog.b ? "on" : ""}`}
              onClick={() => setTog((s) => ({ ...s, b: !s.b }))}
              role="switch"
              aria-checked={tog.b}
              tabIndex={0}
            />
          </div>
          <div className="srow">
            <span className="rk">Relance auto après 3 jours</span>
            <span
              className={`toggle ${tog.c ? "on" : ""}`}
              onClick={() => setTog((s) => ({ ...s, c: !s.c }))}
              role="switch"
              aria-checked={tog.c}
              tabIndex={0}
            />
          </div>
          <p className="bc-taste" style={{ marginTop: 8 }}>
            Bientôt disponible.
          </p>
        </div>

        <div className="dcard">
          <div className="dlbl">Abonnement</div>
          <div className="plan">
            <div>
              <div className="pt">Amont Pro</div>
              <div className="pp">29 € / mois · briefs illimités</div>
            </div>
            <button className="mng" type="button">
              Gérer
            </button>
          </div>
        </div>

        {error && (
          <p
            className="wp-empty-sub"
            style={{ color: "#B33A3A", marginBottom: 10 }}
          >
            {error}
          </p>
        )}
        {savedOk && !error && (
          <p
            className="wp-empty-sub"
            style={{ color: "#2F5E3F", marginBottom: 10 }}
          >
            Enregistré.
          </p>
        )}

        <button
          className="bigbtn"
          type="button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button className="linebtn" type="button" onClick={onSignOut}>
          Se déconnecter
        </button>
        <button className="linebtn" type="button" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}

function defaultPlanDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** date (YYYY-MM-DD) + time (HH:MM) → ISO UTC, interprétés en heure locale. */
function localDateTimeToIso(dateStr, timeStr) {
  const dateParts = String(dateStr || "").split("-").map(Number);
  const timeParts = String(timeStr || "").split(":").map(Number);
  if (dateParts.length < 3 || timeParts.length < 2) return null;
  const [y, m, d] = dateParts;
  const [hh, mm] = timeParts;
  if (![y, m, d, hh, mm].every((n) => Number.isFinite(n))) return null;
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

function PlanSheet({ studio, brief, onClose, onCreated }) {
  const dayOptions = useMemo(() => nextPlanDayOptions(6), []);
  const existing = isoToPlanDateTime(brief?.nextAppointmentAt);
  const [date, setDate] = useState(
    existing.date || dayOptions[0]?.date || defaultPlanDate()
  );
  const [time, setTime] = useState(
    existing.time && PLAN_TIME_SLOTS.includes(existing.time)
      ? existing.time
      : "10:30"
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { slots: clientSlots, note: clientDateNote } = clientAvailabilityFromBrief(
    brief?.brief
  );
  const dispoLabel =
    clientSlots.length > 0
      ? clientSlots.join(" · ")
      : "Non renseignées dans le brief";
  const isMove = Boolean(brief?.primaryAppointmentId);

  const openSmsConfirmation = (startsAt) => {
    const body = buildRdvConfirmationSmsBody({
      clientName: brief?.name,
      studioName: studio?.name,
      startsAt,
      address: brief?.address,
      city: brief?.city,
    });
    const href = rdvConfirmationSmsHref({ phone: brief?.phone, body });
    if (href && typeof window !== "undefined") {
      window.location.href = href;
    }
  };

  const handleSave = async () => {
    setError(null);
    const startsAt = localDateTimeToIso(date, time);
    if (!startsAt) {
      setError(proStudioErrorMessage("starts_at_required"));
      return;
    }

    setLoading(true);
    const result = brief?.primaryAppointmentId
      ? await updateProAppointment(brief.primaryAppointmentId, {
          startsAt,
          durationMin: RDV_DURATION_MIN,
          notes,
        })
      : await createProAppointment({
          studioId: studio?.id,
          linkId: brief?.id,
          startsAt,
          durationMin: RDV_DURATION_MIN,
          notes,
        });
    setLoading(false);

    if (!result.ok) {
      setError(proStudioErrorMessage(result.error));
      return;
    }
    onCreated?.(result.appointment);
    onClose?.();
    openSmsConfirmation(startsAt);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>{isMove ? "Déplacer le RDV" : "Planifier le RDV"}</h3>
        <p className="lead">
          {brief?.name
            ? `Avec ${brief.name}${brief?.city ? ` · ${brief.city}` : ""}`
            : "Choisissez jour et heure"}
        </p>
        <p className="bc-taste" style={{ marginBottom: 14 }}>
          Disponible pour le RDV :{" "}
          <span style={{ color: "var(--ink)" }}>{dispoLabel}</span>
          {clientDateNote ? (
            <>
              <br />
              <span style={{ color: "var(--muted)" }}>{clientDateNote}</span>
            </>
          ) : null}
        </p>

        <div className="label" style={{ marginTop: 0 }}>
          Jour
        </div>
        <div className="filters">
          {dayOptions.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`fp ${date === d.date ? "on" : ""}`}
              onClick={() => setDate(d.date)}
            >
              {d.chipLabel}
            </button>
          ))}
        </div>

        <div className="label">Heure</div>
        <div className="filters">
          {PLAN_TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`fp ${time === slot ? "on" : ""}`}
              onClick={() => setTime(slot)}
            >
              {slot.replace(":", " h ")}
            </button>
          ))}
        </div>

        <p className="bc-taste" style={{ marginTop: 10 }}>
          Durée 1 h. En enregistrant, Messages s&apos;ouvre avec la confirmation
          déjà écrite pour{" "}
          {brief?.name?.trim()?.split(/\s+/)[0] || "votre client"}.
        </p>

        <div className="field">
          <label htmlFor="plan-notes">Notes (optionnel)</label>
          <input
            id="plan-notes"
            type="text"
            placeholder="Ex. apporter plans, accès portail…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p
            className="wp-empty-sub"
            style={{ color: "#B33A3A", marginBottom: 12 }}
          >
            {error}
          </p>
        )}

        <button
          className="bigbtn"
          type="button"
          onClick={handleSave}
          disabled={loading || !date || !time}
        >
          <CalendarDays size={18} />
          {loading ? "Enregistrement…" : "Enregistrer le RDV"}
        </button>
        <button className="linebtn" type="button" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}

function SendSheet({ studio, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [createdUrl, setCreatedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    const result = await createProLink(studio?.id, {
      clientName: name,
      clientPhone: phone,
      clientAddress: address,
    });
    setLoading(false);
    if (!result.ok) {
      setError(proStudioErrorMessage(result.error));
      return;
    }
    setCreatedUrl(result.link.url);
    onCreated?.(result.link);
  };

  const copy = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier. Sélectionnez le lien manuellement.");
    }
  };

  const smsHref = createdUrl
    ? `sms:?&body=${encodeURIComponent(
        `Bonjour, préparez notre rendez-vous en 3 min : ${createdUrl}`
      )}`
    : null;
  const mailHref = createdUrl
    ? `mailto:?subject=${encodeURIComponent(
        "Préparez notre rendez-vous jardin"
      )}&body=${encodeURIComponent(
        `Bonjour,\n\nAvant notre rendez-vous, merci de répondre à ce court questionnaire (3 min, sans compte) :\n${createdUrl}\n\nÀ bientôt,\n${studio?.name || ""}`
      )}`
    : null;

  return (
    <div className="wp-send-full">
      <button type="button" className="back" onClick={onClose} aria-label="Fermer">
        <X size={20} />
      </button>
      <p className="label" style={{ marginTop: 8, marginBottom: 0 }}>
        Nouveau client
      </p>
      <h2 className="h-title" style={{ fontWeight: 300, marginTop: 8, lineHeight: 1.1 }}>
        Envoyer un lien
        <br />
        avant le RDV
      </h2>
      <p className="bc-taste" style={{ marginTop: 6 }}>
        Votre client remplit son brief en quelques minutes, sans créer de compte.
      </p>
      <div style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="wp-client-name">Nom du client</label>
          <input
            id="wp-client-name"
            placeholder="Ex. Famille Roux"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={Boolean(createdUrl) || loading}
          />
        </div>
        <div className="field">
          <label htmlFor="wp-client-phone">Téléphone</label>
          <input
            id="wp-client-phone"
            placeholder="06 …"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={Boolean(createdUrl) || loading}
          />
        </div>
        <div className="field">
          <label htmlFor="wp-client-addr">Adresse (facultatif)</label>
          <input
            id="wp-client-addr"
            placeholder="Ville, code postal…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={Boolean(createdUrl) || loading}
          />
        </div>

        {createdUrl ? (
          <>
            <div className="linkbox">
              <span className="u">{createdUrl.replace(/^https?:\/\//, "")}</span>
              <button type="button" onClick={copy}>
                {copied ? (
                  <>
                    <Check size={14} /> Copié
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copier
                  </>
                )}
              </button>
            </div>
            <div className="sendrow">
              <a href={smsHref}>SMS</a>
              <a href={mailHref}>E-mail</a>
              <button type="button" disabled title="Bientôt">
                QR code
              </button>
            </div>
            <div className="note">
              Le brief revient <b>directement dans votre app</b>, avec le nom et
              les coordonnées du client. Rien à ressaisir.
            </div>
            <button className="bigbtn" onClick={onClose} type="button">
              <Send size={18} /> Terminé
            </button>
          </>
        ) : (
          <>
            {error && (
              <p className="wp-form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="bigbtn"
              onClick={handleCreate}
              type="button"
              disabled={loading || !name.trim()}
            >
              <Send size={18} />
              {loading ? "Création…" : "Créer le lien"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProAuthGate() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/connexion?profil=pro");
  }, [router]);

  return (
    <div className="wp">
      <div className="phone">
        <div className="screen">
          <div className="bf-loading">Redirection…</div>
        </div>
      </div>
    </div>
  );
}

function ProBootError({ message, onRetry }) {
  return (
    <div className="wp">
      <div className="phone">
        <div className="screen">
          <div className="card-panel wp-empty">
            <p className="wp-empty-title">Impossible de démarrer</p>
            <p className="wp-empty-sub">{message}</p>
            <button className="bigbtn" type="button" onClick={onRetry}>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WilderProV2() {
  const [phase, setPhase] = useState("boot"); // boot | auth | ready | error
  const [bootError, setBootError] = useState(null);
  const [user, setUser] = useState(null);
  const [studio, setStudio] = useState(null);
  const [items, setItems] = useState([]);
  const [linksStatus, setLinksStatus] = useState("idle"); // idle | loading | ready | error
  const [linksError, setLinksError] = useState(null);
  const [tab, setTab] = useState("projets");
  const [listCategory, setListCategory] = useState("ready");
  const [detailBackTab, setDetailBackTab] = useState("clients");
  const [notifsSeen, setNotifsSeen] = useState(false);
  const [active, setActive] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [planSheet, setPlanSheet] = useState(false);
  const [settingsSheet, setSettingsSheet] = useState(false);
  const [agendaKey, setAgendaKey] = useState(0);
  const [realisationsKey, setRealisationsKey] = useState(0);
  const [activeProject, setActiveProject] = useState(null);

  const loadLinks = useCallback(async (studioId) => {
    if (!studioId) {
      setItems([]);
      setLinksError(null);
      setLinksStatus("ready");
      return { ok: true, items: [] };
    }
    setLinksStatus("loading");
    setLinksError(null);
    const result = await listProLinksWithBriefs(studioId);
    if (result.ok) {
      setItems(result.items);
      setLinksStatus("ready");
      return result;
    }
    const message = proStudioErrorMessage(result.error, result.detail);
    console.error("[Wilder Pro] list:", result.error, result.detail || "");
    setLinksError(message);
    setLinksStatus("error");
    return result;
  }, []);

  const boot = useCallback(async () => {
    setPhase("boot");
    setBootError(null);

    const auth = await getProAuthUser();
    if (!auth.ok) {
      if (auth.error === "cloud_unavailable") {
        setBootError(proStudioErrorMessage(auth.error));
        setPhase("error");
        return;
      }
      setPhase("auth");
      return;
    }

    setUser(auth.user);
    const studioRes = await ensureProStudio();
    if (!studioRes.ok) {
      setBootError(proStudioErrorMessage(studioRes.error));
      setPhase("error");
      return;
    }

    setStudio(studioRes.studio);
    await loadLinks(studioRes.studio.id);
    setPhase("ready");
  }, [loadLinks]);

  useEffect(() => {
    boot();
  }, [boot]);

  const open = (b, backTab = "clients") => {
    setDetailBackTab(backTab);
    setActive(b);
    setTab("detail");
  };

  const notifEvents = buildProNotificationEvents(items);
  const notifBadge = notifsSeen ? 0 : notifEvents.length;

  const onSignOut = async () => {
    await signOutCloud().catch(() => {});
    setUser(null);
    setStudio(null);
    setItems([]);
    setLinksStatus("idle");
    setLinksError(null);
    setActive(null);
    setActiveProject(null);
    setTab("projets");
    setNotifsSeen(false);
    setPhase("auth");
  };

  if (phase === "boot") {
    return (
      <div className="wp">
        <div className="phone">
          <div className="screen">
            <div className="bf-loading">Chargement…</div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <ProBootError message={bootError || proStudioErrorMessage()} onRetry={boot} />
    );
  }

  if (phase === "auth") {
    return (
      <ProAuthGate />
    );
  }

  return (
    <div className="wp">
      <ProDesktopSidebar
        tab={tab}
        studio={studio}
        onNavProjets={() => setTab("projets")}
        onNavAgenda={() => setTab("agenda")}
        onNavRealisations={() => {
          setActiveProject(null);
          setTab("realisations");
        }}
        onNavStudio={() => setTab("studio")}
        onSendLink={() => setSheet(true)}
      />
      <div className="phone">
        <div
          className={`screen${
            tab === "clients" || tab === "detail" || tab === "notifs"
              ? " wp-desktop-narrow"
              : ""
          }${tab === "agenda" ? " wp-desktop-agenda" : ""}`}
        >
          {sheet && (
            <SendSheet
              studio={studio}
              onClose={() => setSheet(false)}
              onCreated={async () => {
                await loadLinks(studio?.id);
              }}
            />
          )}
          {!sheet && tab === "projets" && (
            <ProjetsHome
              studio={studio}
              items={items}
              linksStatus={linksStatus}
              linksError={linksError}
              onRetryLinks={() => loadLinks(studio?.id)}
              onSend={() => setSheet(true)}
              onOpenList={(cat) => {
                setListCategory(cat);
                setTab("clients");
              }}
              onOpenNotifs={() => {
                setNotifsSeen(true);
                setTab("notifs");
              }}
              onOpenSettings={() => setSettingsSheet(true)}
              onOpen={(b) => open(b, "projets")}
              notifCount={notifBadge}
            />
          )}
          {!sheet && tab === "notifs" && (
            <NotifsScreen
              items={items}
              onBack={() => setTab("projets")}
              onOpenItem={(id) => {
                const b = items.find((i) => i.id === id);
                if (b) open(b, "projets");
              }}
            />
          )}
          {!sheet && tab === "clients" && (
            <ClientList
              category={listCategory}
              items={items}
              linksStatus={linksStatus}
              linksError={linksError}
              onRetryLinks={() => loadLinks(studio?.id)}
              onBack={() => setTab("projets")}
              onOpen={(b) => open(b, "clients")}
              onSend={() => setSheet(true)}
            />
          )}
          {!sheet && tab === "studio" && (
            <StudioScreen
              studio={studio}
              onOpenSettings={() => setSettingsSheet(true)}
            />
          )}
          {!sheet && tab === "detail" && active && (
            <BriefDetailScreen
              b={active}
              studio={studio}
              onBack={() => setTab(detailBackTab)}
              onPlanifier={() => setPlanSheet(true)}
              onRefresh={(next) => {
                setActive(next);
                setItems((prev) =>
                  prev.map((i) => (i.id === next.id ? { ...i, ...next } : i))
                );
              }}
              onOpenRealisation={(p) => {
                setActiveProject(p);
                setTab("realisation-detail");
              }}
              onDeleted={() => {
                setItems((prev) => prev.filter((i) => i.id !== active?.id));
                setActive(null);
                setTab(detailBackTab);
              }}
            />
          )}
          {!sheet && tab === "agenda" && (
            <Agenda
              studio={studio}
              refreshKey={agendaKey}
              onOpenSettings={() => setSettingsSheet(true)}
              onOpenBrief={(linkId) => {
                const b = items.find((i) => i.id === linkId);
                if (b) open(b, "agenda");
              }}
            />
          )}
          {!sheet && tab === "realisations" && (
            <Realisations
              studio={studio}
              refreshKey={realisationsKey}
              onOpen={(p) => {
                setActiveProject(p);
                setTab("realisation-detail");
              }}
              onCreate={() => {
                setActiveProject(null);
                setTab("realisation-form");
              }}
              onOpenSettings={() => setSettingsSheet(true)}
            />
          )}
          {!sheet && tab === "realisation-detail" && activeProject && (
            <RealisationDetail
              project={activeProject}
              studio={studio}
              onBack={() => {
                setActiveProject(null);
                setTab("realisations");
                setRealisationsKey((k) => k + 1);
              }}
              onEdit={() => setTab("realisation-form")}
              onDeleted={() => {
                setActiveProject(null);
                setTab("realisations");
                setRealisationsKey((k) => k + 1);
              }}
              onOpenSettings={() => setSettingsSheet(true)}
              onProjectChange={(next) => setActiveProject(next)}
            />
          )}
          {!sheet && tab === "realisation-form" && (
            <RealisationForm
              studio={studio}
              project={activeProject}
              onClose={() => {
                if (activeProject?.id) setTab("realisation-detail");
                else {
                  setActiveProject(null);
                  setTab("realisations");
                }
              }}
              onSaved={(saved) => {
                setActiveProject(saved);
                setRealisationsKey((k) => k + 1);
                setTab("realisation-detail");
              }}
              onOpenSettings={() => setSettingsSheet(true)}
            />
          )}
        </div>

        {!sheet && (
          <nav className="tabbar" aria-label="Navigation principale">
            <button
              className={`tab ${
                tab === "projets" ||
                tab === "clients" ||
                tab === "detail" ||
                tab === "notifs"
                  ? "on"
                  : ""
              }`}
              onClick={() => setTab("projets")}
              type="button"
            >
              Projets
            </button>
            <button
              className={`tab ${tab === "agenda" ? "on" : ""}`}
              onClick={() => setTab("agenda")}
              type="button"
            >
              Agenda
            </button>
            <button
              className={`tab ${
                tab === "realisations" ||
                tab === "realisation-detail" ||
                tab === "realisation-form"
                  ? "on"
                  : ""
              }`}
              onClick={() => {
                setActiveProject(null);
                setTab("realisations");
              }}
              type="button"
            >
              Réalisations
            </button>
            <button
              className={`tab ${tab === "studio" ? "on" : ""}`}
              onClick={() => setTab("studio")}
              type="button"
            >
              Studio
            </button>
          </nav>
        )}
        {planSheet && active && (
          <PlanSheet
            studio={studio}
            brief={active}
            onClose={() => setPlanSheet(false)}
            onCreated={async () => {
              await loadLinks(studio?.id);
              setAgendaKey((k) => k + 1);
              // Rafraîchir la fiche active avec le nouveau statut
              const refreshed = await listProLinksWithBriefs(studio?.id);
              if (refreshed.ok) {
                const next = refreshed.items.find((i) => i.id === active.id);
                if (next) setActive(next);
              }
            }}
          />
        )}
        {settingsSheet && (
          <SettingsSheet
            studio={studio}
            authEmail={user?.email || ""}
            onClose={() => setSettingsSheet(false)}
            onSaved={(next) => setStudio(next)}
            onSignOut={async () => {
              setSettingsSheet(false);
              await onSignOut();
            }}
          />
        )}
      </div>
    </div>
  );
}
