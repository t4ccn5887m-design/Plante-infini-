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
} from "@/lib/pro/proStudioApi";
import {
  deriveRdvTodos,
  deriveVigilance,
} from "@/lib/pro/briefDerive";
import { printBriefPdf } from "@/lib/pro/briefDetailActions";

/* ============================================================
   WILDER PRO — branché Supabase (étape C)
   Styles : styles/pro/wilder-pro.css (préfixe .wp)
   ============================================================ */

const ST = {
  ready: { c: "ready", l: "Brief prêt" },
  rdv: { c: "rdv", l: "RDV planifié" },
  wait: { c: "wait", l: "En attente" },
};

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

function Accueil({ studio, items, onSend, onBriefs, onOpen }) {
  const ready = items.filter((b) => b.status === "ready" || b.status === "rdv");
  const waiting = items.filter((b) => b.status === "wait");
  const empty = items.length === 0;

  return (
    <div className="card-panel">
      <div className="hero">
        <div className="ava">{studio?.initials || "?"}</div>
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

function Briefs({ items, studio, onOpen }) {
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
        <div className="ava">{studio?.initials || "?"}</div>
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

function Agenda({ studio, refreshKey }) {
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
        <div className="ava">{studio?.initials || "?"}</div>
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

function Profil({ studio, email, onSignOut }) {
  const [color, setColor] = useState(studio?.color || "#2F5E3F");
  const [tog, setTog] = useState({ a: true, b: true, c: false });
  const colors = ["#2F5E3F", "#7A67A6", "#B47327", "#2F5A6E", "#7A2E3F"];
  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Réglages</div>
          <div className="h-sub">{studio?.name || "Mon studio"}</div>
        </div>
        <div className="ava">{studio?.initials || "?"}</div>
      </div>

      <div className="dcard" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="logo-big">{studio?.initials || "?"}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {studio?.name || "Mon studio"}
            </div>
            <div className="rv">
              {studio?.contactFirstName || "Paysagiste"}
              {studio?.interventionZone
                ? ` · ${studio.interventionZone}`
                : ""}
            </div>
          </div>
        </div>
        {email && (
          <div className="srow" style={{ marginTop: 6 }}>
            <span className="rk">E-mail</span>
            <span className="rv">{email}</span>
          </div>
        )}
      </div>

      <div className="dcard">
        <div className="dlbl">Couleur du lien client</div>
        <div className="colorrow">
          {colors.map((c) => (
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
        <div className="mini-hero" style={{ background: color }}>
          <div className="k">Préparez votre rendez-vous avec</div>
          <div className="t">{studio?.name || "votre studio"}</div>
        </div>
        <p className="bc-taste" style={{ marginTop: 10 }}>
          La sauvegarde de la couleur arrive bientôt.
        </p>
      </div>

      <div className="dcard">
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
      </div>

      <div className="dcard">
        <div className="dlbl">Abonnement</div>
        <div className="plan">
          <div>
            <div className="pt">Wilder Pro</div>
            <div className="pp">29 € / mois · briefs illimités</div>
          </div>
          <button className="mng" type="button">
            Gérer
          </button>
        </div>
      </div>

      <button className="linebtn" type="button" onClick={onSignOut}>
        Se déconnecter
      </button>
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
  const [agendaKey, setAgendaKey] = useState(0);

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
            />
          )}
          {tab === "briefs" && (
            <Briefs items={items} studio={studio} onOpen={open} />
          )}
          {tab === "detail" && active && (
            <Detail
              b={active}
              onBack={() => setTab("briefs")}
              onPlanifier={() => setPlanSheet(true)}
            />
          )}
          {tab === "agenda" && (
            <Agenda studio={studio} refreshKey={agendaKey} />
          )}
          {tab === "profil" && (
            <Profil
              studio={studio}
              email={user?.email || ""}
              onSignOut={onSignOut}
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
            className={`tab ${tab === "profil" ? "on" : ""}`}
            onClick={() => setTab("profil")}
            type="button"
          >
            <User size={22} /> Profil
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
      </div>
    </div>
  );
}
