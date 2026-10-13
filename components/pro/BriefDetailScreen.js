import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import { BRIEF_AMBIANCE_IMAGES, BRIEF_CHOICE_IMAGES } from "@/lib/pro/briefAmbianceImages";
import {
  PRO_LINK_STAGE_LABELS,
  buildEnBrefLine,
  deriveLikesAndAvoid,
  deriveTasteProfile,
  deriveVigilance,
  TASTES,
} from "@/lib/pro/briefDerive";
import { buildBriefDetailView } from "@/lib/pro/proStudioApi";
import { resolveProBriefAnalysis } from "@/lib/pro/briefProAnalysis";
import { printBriefPdf } from "@/lib/pro/briefDetailActions";
import {
  getBriefPhotoSignedUrls,
  updateProLinkMeta,
} from "@/lib/pro/proStudioApi";
import { listProProjects, getProjectPhotoSignedUrls } from "@/lib/pro/proProjectsApi";
import { labelsOf, plantLabel, tasteLabel } from "@/lib/pro/briefLabels";

function formatRdv(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function mapsUrl(address, city) {
  const q = [address, city].filter(Boolean).join(", ");
  if (!q) return null;
  return `https://maps.apple.com/?daddr=${encodeURIComponent(q)}`;
}

function smsHref(phone, clientName, studioName) {
  const digits = String(phone || "").replace(/\s/g, "");
  if (!digits) return null;
  const body = encodeURIComponent(
    `Bonjour ${clientName?.split(" ")[0] || ""}, c'est ${studioName || "votre paysagiste"}. `
  );
  return `sms:${digits}?body=${body}`;
}

function pickShowcaseProjects(projects, tasteIds) {
  const labels = labelsOf(TASTES, tasteIds).map((l) => l.toLowerCase());
  const matched = (projects || []).filter((p) => {
    const s = String(p.style || "").toLowerCase();
    return s && labels.some((l) => s.includes(l) || l.includes(s));
  });
  if (matched.length) return matched.slice(0, 3);
  return (projects || []).slice(0, 3);
}

function BriefSuiviPanel({ b, onClose, onUpdated }) {
  const stages = [
    ["done", PRO_LINK_STAGE_LABELS.done],
    ["proposal", PRO_LINK_STAGE_LABELS.proposal],
    ["won", PRO_LINK_STAGE_LABELS.won],
    ["lost", PRO_LINK_STAGE_LABELS.lost],
  ];

  const setStage = async (stage) => {
    const res = await updateProLinkMeta(b.id, { stage });
    if (res.ok) onUpdated({ ...b, stage });
    onClose();
  };

  return (
    <div className="wp-brief-suivi">
      <div className="wp-brief-suivi-panel">
        <h2>Suivi du projet</h2>
        <p className="sub">{b.name}</p>
        <div className="wp-brief-suivi-list">
          {stages.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={b.stage === key ? "on" : ""}
              onClick={() => setStage(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="ghost" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}

export default function BriefDetailScreen({
  b,
  studio,
  onBack,
  onPlanifier,
  onRefresh,
  onOpenRealisation,
}) {
  const view = buildBriefDetailView(b);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectCovers, setProjectCovers] = useState({});
  const [local, setLocal] = useState(b);
  const [suiviOpen, setSuiviOpen] = useState(false);

  useEffect(() => {
    setLocal(b);
  }, [b]);

  const d = view?.detail;
  const brief = local?.brief;
  const details = brief?.details;
  const normalizedDetails = useMemo(() => {
    if (!details || typeof details !== "object") return null;
    return details;
  }, [details]);

  useEffect(() => {
    let cancelled = false;
    const paths = d?.photoPaths;
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
  }, [local?.id, brief?.id, d?.photoPaths]);

  useEffect(() => {
    if (!brief?.id || !studio?.id) return;
    let cancelled = false;
    (async () => {
      setAnalysisLoading(true);
      const res = await resolveProBriefAnalysis({
        brief,
        briefId: brief.id,
        client: { city: local.city || local.address },
        photoSignedUrls: photoUrls,
      });
      if (!cancelled) {
        setAnalysis(res.analysis);
        setAnalysisLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brief, brief?.id, local.city, local.address, photoUrls, studio?.id]);

  useEffect(() => {
    if (!studio?.id) return;
    let cancelled = false;
    (async () => {
      const res = await listProProjects(studio.id);
      if (cancelled || !res.ok) return;
      setProjects(res.items || []);
      const paths = (res.items || []).map((p) => p.coverPath).filter(Boolean);
      if (!paths.length) return;
      const urls = await getProjectPhotoSignedUrls(paths);
      const map = {};
      (res.items || []).forEach((p) => {
        if (!p.coverPath) return;
        const idx = paths.indexOf(p.coverPath);
        if (idx >= 0 && urls[idx]) map[p.id] = urls[idx];
      });
      if (!cancelled) setProjectCovers(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [studio?.id]);

  if (view?.waiting) {
    return (
      <div className="card-panel">
        <button className="back no-print" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Mes briefs
        </button>
        <div className="dcard">
          <div className="dlbl">Fiche brief</div>
          <p className="bc-taste">Le client n’a pas encore rempli son brief.</p>
        </div>
      </div>
    );
  }

  if (view?.unavailable || !d) {
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

  const enBref = buildEnBrefLine(brief);
  const { likes, avoid } = deriveLikesAndAvoid(brief);
  const fallbackProfile = deriveTasteProfile(brief);
  const profil = analysis?.profil || fallbackProfile;
  const points =
    analysis?.points?.length > 0
      ? analysis.points
      : deriveVigilance(brief).map((text) => ({ titre: "Point", texte: text }));

  const household = normalizedDetails?.household;
  const existing = normalizedDetails?.existing;
  const upkeep = normalizedDetails?.upkeep;
  const tasteIds = Array.isArray(brief.tastes) ? brief.tastes : [];
  const plantIds = Array.isArray(brief.plants) ? brief.plants : [];
  const showcase = pickShowcaseProjects(projects, tasteIds);

  const fullAddress = [local.address, local.city].filter(Boolean).join(", ");
  const itinerary = mapsUrl(local.address, local.city);
  const phoneHref = local.phone ? `tel:${local.phone.replace(/\s/g, "")}` : null;
  const smsLink = smsHref(local.phone, local.name, studio?.name);
  const clientEmail = local.clientEmail || local.email || "";
  const mailHref = clientEmail
    ? `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(`Votre jardin — ${studio?.name || "Sevya"}`)}`
    : null;

  const dispo =
    upkeep?.availability?.length > 0
      ? upkeep.availability.join(", ")
      : null;

  const onMarkRdvDone = async () => {
    const res = await updateProLinkMeta(local.id, { stage: "done" });
    if (res.ok) {
      const next = { ...local, stage: "done" };
      setLocal(next);
      onRefresh?.(next);
      setSuiviOpen(true);
    }
  };

  const onStageUpdated = (next) => {
    setLocal(next);
    onRefresh?.(next);
  };

  const footer = (() => {
    if (local.status === "ready" && !local.hasAppointment) {
      return (
        <button type="button" className="bf-btn primary full" onClick={onPlanifier}>
          Planifier le RDV
        </button>
      );
    }
    if (local.hasAppointment && !local.stage) {
      return (
        <>
          <div className="wp-brief-foot-meta">
            <span>RDV · {formatRdv(local.nextAppointmentAt)}</span>
          </div>
          <div className="wp-brief-foot-row">
            <button type="button" className="bf-btn ghost" onClick={onPlanifier}>
              Déplacer
            </button>
            <button type="button" className="bf-btn primary" onClick={onMarkRdvDone}>
              RDV fait ›
            </button>
          </div>
        </>
      );
    }
    if (local.stage) {
      return (
        <button type="button" className="bf-btn ghost full" onClick={() => setSuiviOpen(true)}>
          Suivi : {PRO_LINK_STAGE_LABELS[local.stage] || local.stage} ›
        </button>
      );
    }
    return (
      <button type="button" className="bf-btn primary full" onClick={onPlanifier}>
        Planifier le RDV
      </button>
    );
  })();

  return (
    <div className="card-panel wp-brief-print wp-brief-detail">
      {photoUrls[0] ? (
        <div className="wp-brief-detail-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrls[0]} alt="" />
          <button className="back no-print wp-brief-hero-back" onClick={onBack} type="button">
            <ArrowLeft size={18} />
          </button>
        </div>
      ) : (
        <button className="back no-print" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Mes briefs
        </button>
      )}

      <div className={photoUrls[0] ? "wp-brief-detail-head overlap" : ""}>
        <div className="k">Brief · {local.date || "reçu"}</div>
        <h1 className="wp-brief-client-name">{local.name}</h1>
        {local.city ? <p className="wp-brief-client-city">{local.city}</p> : null}

        <div className="wp-brief-contact-chips no-print">
          {phoneHref ? (
            <a className="wp-brief-contact-chip" href={phoneHref}>
              <Phone size={15} /> Appeler
            </a>
          ) : null}
          {smsLink ? (
            <a className="wp-brief-contact-chip" href={smsLink}>
              <MessageSquare size={15} /> SMS
            </a>
          ) : null}
          {mailHref ? (
            <a className="wp-brief-contact-chip" href={mailHref}>
              <Mail size={15} /> E-mail
            </a>
          ) : null}
          {itinerary ? (
            <a className="wp-brief-contact-chip" href={itinerary} target="_blank" rel="noreferrer">
              <MapPin size={15} /> Itinéraire
            </a>
          ) : null}
        </div>
      </div>

      {enBref ? (
        <div className="wp-brief-en-bref">
          <div className="k">En bref</div>
          <p>{enBref}</p>
        </div>
      ) : null}

      {d.message?.trim() ? (
        <blockquote className="wp-brief-quote">« {d.message.trim()} »</blockquote>
      ) : null}

      <div className="dcard lav print-block">
        <div className="dlbl">
          <Sparkles size={14} /> Son profil jardin
          {analysisLoading ? " · analyse…" : ""}
        </div>
        <div className="lede">{profil?.style || profil?.lede}</div>
        {profil?.aime ? <p className="bc-taste">{profil.aime}</p> : null}
        {(profil?.priorites || profil?.prios)?.length > 0 ? (
          <>
            <div className="subh">Priorités</div>
            <div className="prio">
              {(profil.priorites || profil.prios).map((p, i) => (
                <div key={p}>
                  <span className="pnum">{i + 1}</span>
                  {p}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {analysis?.pistes?.length > 0 ? (
        <div className="dcard print-block">
          <div className="dlbl">Pistes pour votre proposition</div>
          <p className="wp-brief-kicker">Analyse Sevya · à vous de juger</p>
          <ul className="wp-brief-pistes">
            {analysis.pistes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {points.length > 0 ? (
        <div className="dcard clay print-block">
          <div className="dlbl">
            <AlertTriangle size={14} /> Points à aborder au RDV
          </div>
          <div className="vlist">
            {points.map((p, i) => (
              <div key={i}>
                <b>{p.titre}</b>
                {p.texte ? ` — ${p.texte}` : ""}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {household &&
      (household.children || household.pets?.length || household.uses?.length) ? (
        <div className="dcard print-block">
          <div className="dlbl">Qui vit dans le jardin</div>
          {household.children ? (
            <p className="wp-brief-lead">{household.children}</p>
          ) : null}
          {household.pets?.length ? (
            <div className="chipwrap">
              {household.pets.map((p) => (
                <span className="vchip" key={p}>
                  {p}
                </span>
              ))}
            </div>
          ) : null}
          {household.uses?.length ? (
            <>
              <div className="subh">Usages</div>
              <div className="chipwrap">
                {household.uses.map((u) => (
                  <span className="vchip" key={u}>
                    {u}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {(likes.length > 0 || avoid.length > 0) && (
        <div className="dcard print-block">
          <div className="dlbl">Ce qu&apos;il aime · ce qu&apos;il ne veut pas</div>
          {likes.length > 0 ? (
            <div className="chipwrap">
              {likes.map((x) => (
                <span className="vchip sage" key={x}>
                  {x}
                </span>
              ))}
            </div>
          ) : null}
          {avoid.length > 0 ? (
            <div className="chipwrap" style={{ marginTop: 8 }}>
              {avoid.map((x) => (
                <span className="vchip clay" key={x}>
                  ✕ {x}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {(tasteIds.length > 0 || plantIds.length > 0) && (
        <div className="dcard print-block">
          <div className="dlbl">Coups de cœur</div>
          <div className="wp-brief-coup-grid">
            {tasteIds.map((id) => (
              <div key={id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BRIEF_AMBIANCE_IMAGES[id]} alt="" />
                <span>{tasteLabel(id)}</span>
              </div>
            ))}
            {plantIds.map((id) => (
              <div key={id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BRIEF_CHOICE_IMAGES[id]} alt="" />
                <span>{plantLabel(id)}</span>
              </div>
            ))}
          </div>
          {tasteIds.length > 0 ? (
            <>
              <div className="subh">Jardins qui lui plaisent</div>
              <div className="wp-brief-style-row">
                {tasteIds.slice(0, 4).map((id) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={id} src={BRIEF_AMBIANCE_IMAGES[id]} alt="" />
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {(photoUrls.length > 0 ||
        existing?.orientation ||
        d.areaRange ||
        d.utilities) && (
        <div className="dcard print-block">
          <div className="dlbl">Le terrain</div>
          {photoUrls.length > 0 ? (
            <div className="photos real">
              {photoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={`Photo ${i + 1}`} className="photo-img" />
              ))}
            </div>
          ) : null}
          <div className="facts">
            {existing?.orientation ? (
              <div className="row">
                <span className="k">Orientation</span>
                <span className="v">{existing.orientation}</span>
              </div>
            ) : null}
            {existing?.soil ? (
              <div className="row">
                <span className="k">Sol</span>
                <span className="v">{existing.soil}</span>
              </div>
            ) : null}
            {existing?.slope ? (
              <div className="row">
                <span className="k">Pente</span>
                <span className="v">{existing.slope}</span>
              </div>
            ) : null}
            {d.utilities ? (
              <div className="row">
                <span className="k">Eau</span>
                <span className="v">{d.utilities}</span>
              </div>
            ) : null}
            {existing?.keep?.trim() ? (
              <div className="row">
                <span className="k">À garder</span>
                <span className="v">{existing.keep.trim()}</span>
              </div>
            ) : null}
            {existing?.remove?.trim() ? (
              <div className="row">
                <span className="k">À enlever</span>
                <span className="v">{existing.remove.trim()}</span>
              </div>
            ) : null}
            {d.areaRange ? (
              <div className="row">
                <span className="k">Surface</span>
                <span className="v">{d.areaRange}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {upkeep && (upkeep.who || upkeep.time || upkeep.contract) ? (
        <div className="dcard print-block">
          <div className="dlbl">Entretien</div>
          <div className="facts">
            {upkeep.who ? (
              <div className="row">
                <span className="k">Qui entretient</span>
                <span className="v">{upkeep.who}</span>
              </div>
            ) : null}
            {upkeep.time ? (
              <div className="row">
                <span className="k">Temps disponible</span>
                <span className="v">{upkeep.time}</span>
              </div>
            ) : null}
          </div>
          {upkeep.contract ? (
            <p className="bc-taste">
              Contrat d&apos;entretien : <strong>{upkeep.contract}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {(upkeep?.when || d.budget || d.timeline || dispo) && (
        <div className="dcard print-block">
          <div className="dlbl">Calendrier et budget</div>
          <div className="facts">
            {upkeep?.when ? (
              <div className="row">
                <span className="k">Échéance</span>
                <span className="v">{upkeep.when}</span>
              </div>
            ) : d.timeline ? (
              <div className="row">
                <span className="k">Échéance</span>
                <span className="v">{d.timeline}</span>
              </div>
            ) : null}
            {d.budget && d.budget !== "—" ? (
              <div className="row">
                <span className="k">Budget indicatif</span>
                <span className="v">{d.budget}</span>
              </div>
            ) : null}
          </div>
          {upkeep?.date_note?.trim() ? (
            <p className="bc-taste">{upkeep.date_note.trim()}</p>
          ) : null}
          {dispo ? (
            <p className="bc-taste">
              Disponible pour le RDV : <strong>{dispo}</strong>
            </p>
          ) : null}
        </div>
      )}

      {showcase.length > 0 ? (
        <div className="dcard print-block">
          <div className="dlbl">À montrer au RDV</div>
          <p className="wp-brief-kicker">Vos réalisations du même style</p>
          <div className="wp-brief-real-row">
            {showcase.map((p) => (
              <button
                key={p.id}
                type="button"
                className="wp-brief-real-card"
                onClick={() => onOpenRealisation?.(p)}
              >
                {projectCovers[p.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={projectCovers[p.id]} alt="" />
                ) : (
                  <span className="wp-brief-real-ph" />
                )}
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        className="bigbtn no-print"
        onClick={() => printBriefPdf(local.name)}
        type="button"
      >
        <Download size={19} /> Exporter le brief (PDF)
      </button>

      <div className="wp-brief-detail-foot no-print">{footer}</div>

      {suiviOpen ? (
        <BriefSuiviPanel
          b={local}
          onClose={() => setSuiviOpen(false)}
          onUpdated={onStageUpdated}
        />
      ) : null}
    </div>
  );
}
