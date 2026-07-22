import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  FileText,
  Home,
  CalendarDays,
  User,
  Phone,
  Send,
  Plus,
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
} from "lucide-react";
import {
  signInWithEmail,
  signOutCloud,
  signUpWithEmail,
} from "@/lib/cloudSync";
import {
  buildBriefDetailView,
  createProAppointment,
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
import {
  deriveRdvTodos,
  deriveVigilance,
} from "@/lib/pro/briefDerive";
import { printBriefPdf } from "@/lib/pro/briefDetailActions";

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

function BriefCard({ b, onOpen }) {
  const s = ST[b.status] || ST.wait;
  const tap = b.status === "ready" || b.status === "rdv";
  return (
    <button
      className={`bcard ${tap ? "tap" : "wait"}`}
      onClick={() => tap && onOpen(b)}
      type="button"
    >
      <div className="bc-top">
        <div>
          <div className="bc-name">{b.name}</div>
          <div className="bc-meta">
            {[b.city, b.date].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <span className={`status ${s.c}`}>{s.l}</span>
      </div>
      <div className="bc-taste">{b.taste}</div>
      {b.tags?.length > 0 && (
        <div className="bc-tags">
          {b.tags.map((t) => (
            <span className="tg" key={t}>
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="bc-foot">
        {tap ? (
          <>
            <span className="bud">
              {b.budget} <span>budget</span>
            </span>
            <ChevronRight size={20} color="#8B9088" />
          </>
        ) : (
          <>
            <span className="bc-meta">
              {b.linkStatus === "opened" ? "Ouvert — pas encore rempli" : "Pas encore rempli"}
            </span>
            <span className="relance">Relancer</span>
          </>
        )}
      </div>
    </button>
  );
}

function Accueil({ studio, items, onSend, onBriefs, onOpen, onOpenSettings }) {
  const ready = items.filter((b) => b.status === "ready" || b.status === "rdv");
  const waiting = items.filter((b) => b.status === "wait");
  const empty = items.length === 0;

  return (
    <div className="card-panel">
      <div className="hero">
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
        <h1>Vos clients, compris d&apos;avance</h1>
        <p>
          Envoyez un lien, recevez un brief clair avant même le premier
          rendez-vous.
        </p>
      </div>

      {empty ? (
        <div className="wp-empty">
          <p className="wp-empty-title">Envoyez votre premier lien</p>
          <p className="wp-empty-sub">
            Votre client remplit son brief en 3 min — sans compte, sans app.
          </p>
          <button className="bigbtn" type="button" onClick={onSend}>
            <Send size={18} /> Envoyer un lien
          </button>
        </div>
      ) : (
        <>
          <div className="label">À traiter</div>
          <button className="pcard peach" onClick={onSend} type="button">
            <span className="ic">
              <Send size={22} color="#DB7E44" />
            </span>
            <span className="tx">
              <div className="tt">Envoyer un lien</div>
              <div className="ss">Préparer un nouveau client</div>
            </span>
            <ChevronRight className="chev" size={22} />
          </button>
          <button className="pcard mint" onClick={onBriefs} type="button">
            <span className="ic">
              <FileText size={22} color="#4E7B52" />
            </span>
            <span className="tx">
              <div className="tt">Briefs prêts</div>
              <div className="ss">
                {ready.length === 0
                  ? "Aucun pour l’instant"
                  : `${ready.length} à consulter`}
              </div>
            </span>
            <span className="count" style={{ color: "#4E7B52" }}>
              {ready.length}
            </span>
          </button>
          <button className="pcard lav" onClick={onBriefs} type="button">
            <span className="ic">
              <CalendarDays size={22} color="#7A67A6" />
            </span>
            <span className="tx">
              <div className="tt">En attente</div>
              <div className="ss">
                {waiting.length === 0
                  ? "Tous les liens sont remplis"
                  : `${waiting.length} client${waiting.length > 1 ? "s" : ""}`}
              </div>
            </span>
            <span className="count" style={{ color: "#7A67A6" }}>
              {waiting.length}
            </span>
          </button>

          {ready.length > 0 && (
            <>
              <div className="label">Derniers briefs</div>
              <div className="blist">
                {ready.slice(0, 3).map((b) => (
                  <BriefCard key={b.id} b={b} onOpen={onOpen} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Briefs({ items, studio, onOpen, onOpenSettings }) {
  const [f, setF] = useState("all");
  const shown = items.filter((b) => f === "all" || b.status === f);
  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Mes briefs</div>
          <div className="h-sub">
            {items.length} client{items.length !== 1 ? "s" : ""}
          </div>
        </div>
        <StudioAvatar studio={studio} onOpen={onOpenSettings} />
      </div>
      <div className="filters">
        <button
          className={`fp ${f === "all" ? "on" : ""}`}
          onClick={() => setF("all")}
          type="button"
        >
          Tous
        </button>
        <button
          className={`fp ${f === "ready" ? "on" : ""}`}
          onClick={() => setF("ready")}
          type="button"
        >
          Prêts
        </button>
        <button
          className={`fp ${f === "rdv" ? "on" : ""}`}
          onClick={() => setF("rdv")}
          type="button"
        >
          RDV
        </button>
        <button
          className={`fp ${f === "wait" ? "on" : ""}`}
          onClick={() => setF("wait")}
          type="button"
        >
          En attente
        </button>
      </div>
      {shown.length === 0 ? (
        <div className="wp-empty" style={{ marginTop: 18 }}>
          <p className="wp-empty-title">Aucun brief ici</p>
          <p className="wp-empty-sub">
            {items.length === 0
              ? "Envoyez un lien pour recevoir votre premier brief."
              : "Changez de filtre pour voir d’autres clients."}
          </p>
        </div>
      ) : (
        <div className="blist" style={{ marginTop: 12 }}>
          {shown.map((b) => (
            <BriefCard key={b.id} b={b} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ b, onBack, onPlanifier }) {
  const view = buildBriefDetailView(b);
  const [photoUrls, setPhotoUrls] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const paths = view?.detail?.photoPaths;
    (async () => {
      if (!paths?.length) {
        setPhotoUrls([]);
        return;
      }
      const urls = await getBriefPhotoSignedUrls(paths);
      if (!cancelled) setPhotoUrls(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [b?.id, b?.brief?.id]);

  if (view?.waiting) {
    return (
      <div className="card-panel">
        <button className="back no-print" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Mes briefs
        </button>
        <div className="dcard">
          <div className="dlbl">Fiche brief</div>
          <p className="bc-taste">
            Le client n’a pas encore rempli son brief.
          </p>
        </div>
      </div>
    );
  }

  if (view?.unavailable || !view?.detail) {
    return (
      <div className="card-panel">
        <button className="back no-print" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Mes briefs
        </button>
        <div className="dcard">
          <div className="dlbl">Fiche brief</div>
          <p className="bc-taste">Brief indisponible.</p>
        </div>
      </div>
    );
  }

  const d = view.detail;
  const vigilance = deriveVigilance(b.brief);
  const todos = deriveRdvTodos(b.brief);
  const ctx = d.users.length ? d.users.join(" · ") : null;

  const onExportPdf = () => {
    printBriefPdf(b.name);
  };

  return (
    <div className="card-panel wp-brief-print">
      <button className="back no-print" onClick={onBack} type="button">
        <ArrowLeft size={18} /> Mes briefs
      </button>

      <div className="dhero">
        <div className="who">{b.name}</div>
        <div className="coord">
          {(b.address || b.city) && (
            <span>
              <MapPin size={15} /> {[b.address, b.city].filter(Boolean).join(" · ")}
            </span>
          )}
          {b.phone && (
            <span>
              <Phone size={15} /> {b.phone}
              {ctx ? ` · ${ctx}` : ""}
            </span>
          )}
          {!b.phone && ctx && (
            <span>
              <User size={15} /> {ctx}
            </span>
          )}
        </div>
        <div className="badge">
          <Sparkles size={15} />{" "}
          {b.status === "rdv" ? "RDV planifié" : "Brief prêt"}
          {b.date ? ` — reçu le ${b.date}` : ""}
        </div>
        <div className="acts no-print">
          <button className="prim" type="button" onClick={onPlanifier}>
            <CalendarDays size={17} /> Planifier
          </button>
          {b.phone ? (
            <a className="ghost" href={`tel:${b.phone.replace(/\s/g, "")}`}>
              <Phone size={17} /> Appeler
            </a>
          ) : (
            <button className="ghost" type="button" disabled>
              <Phone size={17} /> Appeler
            </button>
          )}
        </div>
      </div>

      <div className="dcard lav print-block">
        <div className="dlbl">
          <Sparkles size={14} /> Profil jardin · goût déduit
        </div>
        <div className="lede">{d.lede}</div>
        <div className="statrow">
          {d.spec.map(([k, v]) => (
            <div className="statpill" key={k}>
              <div className="k">{k}</div>
              <div className="v">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {d.prios.length > 0 && (
        <div className="dcard print-block">
          <div className="dlbl">Priorités du client</div>
          <div className="prio">
            {d.prios.map((p, i) => (
              <div key={p}>
                <span className="pnum">{i + 1}</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dcard print-block">
        <div className="dlbl">Végétaux souhaités</div>
        {d.vegetaux.length > 0 ? (
          <div className="chipwrap">
            {d.vegetaux.map((v) => (
              <span className="vchip" key={v}>
                {v}
              </span>
            ))}
          </div>
        ) : (
          <p className="bc-taste">Aucun végétaux sélectionné.</p>
        )}
        <div className="subh">Matériaux & couleurs</div>
        {d.materiaux.length > 0 ? (
          <div className="chipwrap">
            {d.materiaux.map((m) => (
              <span className="vchip" key={m}>
                {m}
              </span>
            ))}
          </div>
        ) : (
          <p className="bc-taste">Aucune matière sélectionnée.</p>
        )}
        {d.tastes.length > 0 && (
          <>
            <div className="subh">Ambiances</div>
            <div className="chipwrap">
              {d.tastes.map((t) => (
                <span
                  className="vchip"
                  key={t}
                  style={{ background: "#ECE6F5", color: "#7A67A6" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="dcard no-print">
        <div className="dlbl">
          <Camera size={14} /> Photos du client
        </div>
        {photoUrls.length > 0 ? (
          <div className="photos real">
            {photoUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={`Photo ${i + 1}`} className="photo-img" />
            ))}
          </div>
        ) : (
          <p className="bc-taste">Aucune photo.</p>
        )}
      </div>

      <div className="dcard no-print">
        <div className="dlbl">
          <Leaf size={14} /> Budget & mot du client
        </div>
        <div className="facts">
          <div className="row">
            <span className="k">Budget</span>
            <span className="v">{d.budget}</span>
          </div>
          {d.maintenanceTitle && (
            <div className="row">
              <span className="k">Entretien</span>
              <span className="v">{d.maintenanceTitle}</span>
            </div>
          )}
        </div>
        {d.message.trim() ? (
          <p className="wp-client-message">« {d.message.trim()} »</p>
        ) : null}
      </div>

      {vigilance.length > 0 && (
        <div className="dcard amber print-block">
          <div className="dlbl">
            <AlertTriangle size={14} /> Points de vigilance
          </div>
          <div className="vlist">
            {vigilance.map((v, i) => (
              <div key={i}>
                › <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {todos.length > 0 && (
        <div className="dcard print-block">
          <div className="dlbl">À aborder au premier RDV</div>
          <div className="todo">
            {todos.map((t) => (
              <div key={t}>
                <span className="chk" />
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="bigbtn no-print" onClick={onExportPdf} type="button">
        <Download size={19} /> Exporter le brief (PDF)
      </button>
    </div>
  );
}

function Realisations({ studio, refreshKey, onOpen, onCreate, onOpenSettings }) {
  const [items, setItems] = useState([]);
  const [coverUrls, setCoverUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(proProjectsErrorMessage(result.error));
        setItems([]);
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
  }, [studio?.id, refreshKey]);

  const empty = !loading && !error && items.length === 0;

  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Réalisations</div>
          <div className="h-sub">
            {loading
              ? "Chargement…"
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
          <p className="wp-empty-title">Réalisations indisponibles</p>
          <p className="wp-empty-sub">{error}</p>
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
                  <div className="wp-proj-title">{p.title}</div>
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
        <div className="who">{project?.title}</div>
        {project?.location ? (
          <div className="coord">
            <span>
              <MapPin size={15} /> {project.location}
            </span>
          </div>
        ) : null}
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
        {photos.length === 0 ? (
          <p className="bc-taste">Aucune photo pour l’instant.</p>
        ) : (
          <div className="wp-proj-gallery">
            {photos.map((photo, i) => (
              <div className="wp-proj-gal-item" key={photo.id}>
                <SafePhoto src={photoUrls[i]} alt="" />
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
          </div>
        )}
      </div>

      {error && (
        <p className="wp-form-error" role="alert">
          {error}
        </p>
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
        <p className="wp-field-hint">
          Les photos iPhone sont compressées avant envoi. HEIC illisible →
          message, pas de plantage.
        </p>
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

function Agenda({ studio, refreshKey, onOpenSettings }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(proStudioErrorMessage(result.error));
        setGroups([]);
        return;
      }
      setGroups(result.groups || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [studio?.id, refreshKey]);

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
          <p className="wp-empty-title">Agenda indisponible</p>
          <p className="wp-empty-sub">{error}</p>
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
                <div className="rdv" key={a.id}>
                  <div className="when">
                    <div className="d">{a.dayNum}</div>
                    <div className="m">{a.monthShort}</div>
                  </div>
                  <div>
                    <div className="who2">{a.clientName}</div>
                    <div className="info">
                      {a.timeLabel}
                      {a.durationMin ? ` · ${a.durationMin} min` : ""}
                    </div>
                    {a.notes ? (
                      <div className="info" style={{ marginTop: 4 }}>
                        {a.notes}
                      </div>
                    ) : null}
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
  const [date, setDate] = useState(defaultPlanDate);
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setError(null);
    const startsAt = localDateTimeToIso(date, time);
    if (!startsAt) {
      setError(proStudioErrorMessage("starts_at_required"));
      return;
    }

    setLoading(true);
    const result = await createProAppointment({
      studioId: studio?.id,
      linkId: brief?.id,
      startsAt,
      durationMin: Number(duration) || 60,
      notes,
    });
    setLoading(false);

    if (!result.ok) {
      setError(proStudioErrorMessage(result.error));
      return;
    }
    onCreated?.(result.appointment);
    onClose?.();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>Planifier un RDV</h3>
        <p className="lead">
          {brief?.name
            ? `Rendez-vous avec ${brief.name}`
            : "Choisissez date et heure"}
        </p>

        <div className="field">
          <label htmlFor="plan-date">Date</label>
          <input
            id="plan-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="plan-time">Heure</label>
          <input
            id="plan-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="plan-duration">Durée (minutes)</label>
          <input
            id="plan-duration"
            type="number"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
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
          disabled={loading}
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
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>Envoyer le lien à un client</h3>
        <p className="lead">
          Il remplit son brief en 3 min — sans compte, sans téléchargement.
        </p>
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

function ProAuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    const result =
      mode === "signup"
        ? await fn(email.trim(), password)
        : await fn(email.trim(), password, { rememberMe: true });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Connexion impossible.");
      return;
    }
    const check = await getProAuthUser();
    if (!check.ok) {
      setError(
        "Compte créé — confirmez votre e-mail si demandé, puis reconnectez-vous."
      );
      return;
    }
    onAuthenticated?.(check.user);
  };

  return (
    <div className="wp">
      <div className="phone">
        <div className="screen">
          <div className="card-panel wp-auth">
            <div className="hero">
              <div className="ava">WP</div>
              <h1>Wilder Pro</h1>
              <p>
                Connectez-vous pour envoyer des liens et recevoir les briefs de
                vos clients.
              </p>
            </div>
            <div className="wp-auth-tabs">
              <button
                type="button"
                className={mode === "signup" ? "on" : ""}
                onClick={() => setMode("signup")}
                disabled={loading}
              >
                Créer un compte
              </button>
              <button
                type="button"
                className={mode === "signin" ? "on" : ""}
                onClick={() => setMode("signin")}
                disabled={loading}
              >
                Se connecter
              </button>
            </div>
            <form className="wp-auth-form" onSubmit={submit}>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                disabled={loading}
              />
              <button className="bigbtn" type="submit" disabled={loading}>
                {loading
                  ? "Patientez…"
                  : mode === "signup"
                    ? "Créer mon compte pro"
                    : "Entrer"}
              </button>
            </form>
            {error && (
              <p className="wp-form-error" role="alert">
                {error}
              </p>
            )}
            <p className="wp-auth-note">
              Même compte que l’app particulier — un studio pro lui est
              rattaché automatiquement.
            </p>
          </div>
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
  const [tab, setTab] = useState("accueil");
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
      return;
    }
    const result = await listProLinksWithBriefs(studioId);
    if (result.ok) setItems(result.items);
    else console.error("[Wilder Pro] list:", result.error);
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

  const open = (b) => {
    setActive(b);
    setTab("detail");
  };

  const onSignOut = async () => {
    await signOutCloud().catch(() => {});
    setUser(null);
    setStudio(null);
    setItems([]);
    setActive(null);
    setActiveProject(null);
    setTab("accueil");
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
      <ProAuthGate
        onAuthenticated={() => {
          boot();
        }}
      />
    );
  }

  return (
    <div className="wp">
      <div className="phone">
        <div className="screen">
          {tab === "accueil" && (
            <Accueil
              studio={studio}
              items={items}
              onSend={() => setSheet(true)}
              onBriefs={() => setTab("briefs")}
              onOpen={open}
              onOpenSettings={() => setSettingsSheet(true)}
            />
          )}
          {tab === "briefs" && (
            <Briefs
              items={items}
              studio={studio}
              onOpen={open}
              onOpenSettings={() => setSettingsSheet(true)}
            />
          )}
          {tab === "detail" && active && (
            <Detail
              b={active}
              onBack={() => setTab("briefs")}
              onPlanifier={() => setPlanSheet(true)}
            />
          )}
          {tab === "agenda" && (
            <Agenda
              studio={studio}
              refreshKey={agendaKey}
              onOpenSettings={() => setSettingsSheet(true)}
            />
          )}
          {tab === "realisations" && (
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
          {tab === "realisation-detail" && activeProject && (
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
          {tab === "realisation-form" && (
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

        <nav className="tabbar">
          <button
            className={`tab ${tab === "accueil" ? "on" : ""}`}
            onClick={() => setTab("accueil")}
            type="button"
          >
            <Home size={22} /> Accueil
          </button>
          <button
            className={`tab ${tab === "briefs" || tab === "detail" ? "on" : ""}`}
            onClick={() => setTab("briefs")}
            type="button"
          >
            <FileText size={22} /> Briefs
          </button>
          <div className="fab-wrap">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                className="fab"
                onClick={() => setSheet(true)}
                type="button"
              >
                <Plus size={26} />
              </button>
              <span className="fab-lbl">Nouveau</span>
            </div>
          </div>
          <button
            className={`tab ${tab === "agenda" ? "on" : ""}`}
            onClick={() => setTab("agenda")}
            type="button"
          >
            <CalendarDays size={22} /> Agenda
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
            <Images size={22} /> Réalisations
          </button>
        </nav>

        {sheet && (
          <SendSheet
            studio={studio}
            onClose={() => setSheet(false)}
            onCreated={async () => {
              await loadLinks(studio?.id);
            }}
          />
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
