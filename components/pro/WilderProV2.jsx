import { useState } from "react";
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
} from "lucide-react";

/* ============================================================
   WILDER PRO — même identité que la v2 particulier
   Police ronde (Quicksand) · fond greige · cartes pastel arrondies
   · icônes colorées · barre d'onglets flottante + bouton central
   Données mock — pas de Supabase à cette étape.
   Styles : styles/pro/wilder-pro.css (tous sélecteurs sous .wp ;
   importé depuis pages/_app.js — contrainte Next.js Pages Router).
   ============================================================ */

const BRIEFS = [
  {
    id: 1,
    name: "Famille Moreau",
    city: "Aix-en-Provence",
    date: "12 juil.",
    status: "ready",
    budget: "8–12 k€",
    taste: "Ambiance méditerranéenne, faible entretien, l'intimité avant tout.",
    tags: ["Lavande", "Olivier", "Graminées"],
    d: {
      addr: "14 chemin des Oliviers, 13100",
      tel: "06 24 55 18 09",
      ctx: "2 enfants · 1 chien",
      lede: (
        <>
          Un jardin <em>méditerranéen chaleureux</em>, pour se sentir chez soi à
          l&apos;abri des regards — avec un entretien réduit au minimum.
        </>
      ),
      spec: [
        ["Style", "Méditerranéen"],
        ["Ambiance", "Chaleureuse"],
        ["Entretien", "Faible"],
      ],
      prios: ["Intimité", "Détente", "Peu d'entretien", "Convivialité"],
      vegetaux: [
        "Lavande",
        "Olivier",
        "Cordyline",
        "Graminées",
        "Romarin",
        "Agapanthe",
      ],
      materiaux: ["Pierre calcaire", "Bois", "Gravier clair"],
      swatches: ["#8B7BB0", "#B7A06A", "#9CA98C", "#C9BCA6"],
      inspi: ["Jardin sec", "Ton sur ton", "Massifs libres"],
      terrain: [
        ["Orientation", "Sud-Ouest"],
        ["Surface", "≈ 120 m²"],
        ["Sol", "Calcaire, drainant"],
        ["Existant", "Terrasse + pelouse"],
      ],
      vigilance: [
        <>
          Veut du <b>luxuriant</b> mais un entretien <b>très faible</b> — à
          arbitrer au RDV.
        </>,
        <>
          La <b>cordyline</b> craint le gel de l&apos;arrière-pays — proposer une
          alternative rustique ?
        </>,
      ],
      todo: [
        "Confirmer l'arrosage (auto ?)",
        "Vérifier l'accès chantier",
        "Cadrer le budget avec les priorités",
      ],
    },
  },
  {
    id: 2,
    name: "M. Benali",
    city: "Venelles",
    date: "11 juil.",
    status: "rdv",
    budget: "15–20 k€",
    taste:
      "Contemporain épuré, lignes nettes, aime le corten et le minéral.",
    tags: ["Corten", "Graminées", "Buis"],
  },
  {
    id: 3,
    name: "Clara Weiss",
    city: "Le Tholonet",
    date: "10 juil.",
    status: "ready",
    budget: "5–7 k€",
    taste:
      "Jardin de curé foisonnant, pour attirer les pollinisateurs.",
    tags: ["Vivaces", "Rosier", "Aromatiques"],
  },
  {
    id: 4,
    name: "Famille Portelli",
    city: "Puyricard",
    date: "9 juil.",
    status: "wait",
    budget: "—",
    taste: "Lien envoyé — le client n'a pas encore rempli son brief.",
    tags: [],
  },
  {
    id: 5,
    name: "M. & Mme Fabre",
    city: "Éguilles",
    date: "8 juil.",
    status: "wait",
    budget: "—",
    taste: "Lien envoyé — en attente de retour.",
    tags: [],
  },
];

const ST = {
  ready: { c: "ready", l: "Brief prêt" },
  rdv: { c: "rdv", l: "RDV planifié" },
  wait: { c: "wait", l: "En attente" },
};

function BriefCard({ b, onOpen }) {
  const s = ST[b.status];
  const tap = b.status !== "wait" && Boolean(b.d);
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
            {b.city} · {b.date}
          </div>
        </div>
        <span className={`status ${s.c}`}>{s.l}</span>
      </div>
      <div className="bc-taste">{b.taste}</div>
      {b.tags.length > 0 && (
        <div className="bc-tags">
          {b.tags.map((t) => (
            <span className="tg" key={t}>
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="bc-foot">
        {b.status !== "wait" ? (
          <>
            <span className="bud">
              {b.budget} <span>budget</span>
            </span>
            <ChevronRight size={20} color="#8B9088" />
          </>
        ) : (
          <>
            <span className="bc-meta">Pas encore rempli</span>
            <span className="relance">Relancer</span>
          </>
        )}
      </div>
    </button>
  );
}

function Accueil({ onSend, onBriefs, onOpen, onAgenda }) {
  const ready = BRIEFS.filter((b) => b.status === "ready");
  return (
    <div className="card-panel">
      <div className="hero">
        <div className="ava">AV</div>
        <h1>Vos clients, compris d&apos;avance</h1>
        <p>
          Envoyez un lien, recevez un brief clair avant même le premier
          rendez-vous.
        </p>
      </div>

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
          <div className="ss">2 à consulter</div>
        </span>
        <span className="count" style={{ color: "#4E7B52" }}>
          2
        </span>
      </button>
      <button className="pcard lav" onClick={onAgenda} type="button">
        <span className="ic">
          <CalendarDays size={22} color="#7A67A6" />
        </span>
        <span className="tx">
          <div className="tt">RDV à planifier</div>
          <div className="ss">1 client en attente</div>
        </span>
        <ChevronRight className="chev" size={22} />
      </button>

      <div className="label">Derniers briefs</div>
      <div className="blist">
        {ready.map((b) => (
          <BriefCard key={b.id} b={b} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function Briefs({ onOpen }) {
  const [f, setF] = useState("all");
  const shown = BRIEFS.filter((b) => f === "all" || b.status === f);
  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Mes briefs</div>
          <div className="h-sub">{BRIEFS.length} clients</div>
        </div>
        <div className="ava">AV</div>
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
      <div className="blist" style={{ marginTop: 12 }}>
        {shown.map((b) => (
          <BriefCard key={b.id} b={b} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function Detail({ b, onBack, onPdf }) {
  const d = b.d;
  if (!d) {
    return (
      <div className="card-panel">
        <button className="back" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Mes briefs
        </button>
        <div className="dcard">
          <div className="dlbl">Fiche brief</div>
          <p className="bc-taste">
            Détail mock non disponible pour ce brief (données de démo
            partielles).
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="card-panel">
      <button className="back" onClick={onBack} type="button">
        <ArrowLeft size={18} /> Mes briefs
      </button>

      <div className="dhero">
        <div className="who">{b.name}</div>
        <div className="coord">
          <span>
            <MapPin size={15} /> {d.addr} · {b.city}
          </span>
          <span>
            <Phone size={15} /> {d.tel} · {d.ctx}
          </span>
        </div>
        <div className="badge">
          <Sparkles size={15} /> Brief prêt — reçu le {b.date}
        </div>
        <div className="acts">
          <button className="prim" type="button">
            <CalendarDays size={17} /> Planifier
          </button>
          <button className="ghost" type="button">
            <Phone size={17} /> Appeler
          </button>
        </div>
      </div>

      <div className="dcard lav">
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

      <div className="dcard">
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

      <div className="dcard">
        <div className="dlbl">Végétaux souhaités</div>
        <div className="chipwrap">
          {d.vegetaux.map((v) => (
            <span className="vchip" key={v}>
              {v}
            </span>
          ))}
        </div>
        <div className="subh">Matériaux & couleurs</div>
        <div className="chipwrap">
          {d.materiaux.map((m) => (
            <span className="vchip" key={m}>
              {m}
            </span>
          ))}
        </div>
        <div className="sw">
          {d.swatches.map((c, i) => (
            <span key={i} style={{ background: c }} />
          ))}
        </div>
      </div>

      <div className="dcard">
        <div className="dlbl">
          <Camera size={14} /> Inspirations du client
        </div>
        <div className="photos three">
          <div className="photo i1" data-l="Pinterest" />
          <div className="photo i2" data-l="Pinterest" />
          <div className="photo i3" data-l="Photo perso" />
        </div>
        <div className="chipwrap" style={{ marginTop: 12 }}>
          {d.inspi.map((t) => (
            <span
              className="vchip"
              key={t}
              style={{ background: "#ECE6F5", color: "#7A67A6" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="dcard">
        <div className="dlbl">
          <Leaf size={14} /> Le terrain
        </div>
        <div className="photos">
          <div className="photo p1" data-l="Jardin actuel" />
          <div className="photo p2" data-l="Exposition" />
          <div className="photo p3" data-l="Fond de parcelle" />
          <div className="photo p4" data-l="Terrasse" />
        </div>
        <div className="facts">
          {d.terrain.map(([k, v]) => (
            <div className="row" key={k}>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dcard amber">
        <div className="dlbl">
          <AlertTriangle size={14} /> Points de vigilance
        </div>
        <div className="vlist">
          {d.vigilance.map((v, i) => (
            <div key={i}>
              › <span>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dcard">
        <div className="dlbl">À aborder au premier RDV</div>
        <div className="todo">
          {d.todo.map((t) => (
            <div key={t}>
              <span className="chk" />
              {t}
            </div>
          ))}
        </div>
      </div>

      <button className="bigbtn" onClick={onPdf} type="button">
        <Download size={19} /> Exporter le brief (PDF)
      </button>
      <button className="linebtn" type="button">
        Transmettre au pépiniériste
      </button>
    </div>
  );
}

function Agenda() {
  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Rendez-vous</div>
          <div className="h-sub">Cette semaine</div>
        </div>
        <div className="ava">AV</div>
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="rdv">
          <div className="when">
            <div className="d">15</div>
            <div className="m">Juil</div>
          </div>
          <div>
            <div className="who2">M. Benali</div>
            <div className="info">Venelles · 14 h 30 · brief prêt</div>
          </div>
        </div>
        <div className="rdv">
          <div className="when">
            <div className="d">17</div>
            <div className="m">Juil</div>
          </div>
          <div>
            <div className="who2">Famille Moreau</div>
            <div className="info">Aix-en-Provence · 10 h · à confirmer</div>
          </div>
        </div>
      </div>
      <div className="label">À planifier</div>
      <div
        className="rdv"
        style={{ background: "var(--lav-bg)", borderColor: "#e0d8f0" }}
      >
        <div className="when" style={{ background: "#fff" }}>
          <Clock size={22} color="#7A67A6" style={{ margin: "4px" }} />
        </div>
        <div>
          <div className="who2">Clara Weiss</div>
          <div className="info">Le Tholonet · brief reçu, pas de date</div>
        </div>
      </div>
    </div>
  );
}

function Profil() {
  const [color, setColor] = useState("#2F5E3F");
  const [tog, setTog] = useState({ a: true, b: true, c: false });
  const colors = ["#2F5E3F", "#7A67A6", "#B47327", "#2F5A6E", "#7A2E3F"];
  return (
    <div className="card-panel">
      <div className="head-row">
        <div>
          <div className="h-title">Réglages</div>
          <div className="h-sub">Atelier Vert</div>
        </div>
        <div className="ava">AV</div>
      </div>

      <div className="dcard" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="logo-big">AV</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Atelier Vert</div>
            <div className="rv">Julien Marchand · Aix + 30 km</div>
          </div>
        </div>
        <div className="srow" style={{ marginTop: 6 }}>
          <span className="rk">Téléphone</span>
          <span className="rv">06 12 34 56 78</span>
        </div>
        <div className="srow">
          <span className="rk">E-mail</span>
          <span className="rv">contact@ateliervert.fr</span>
        </div>
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
          <div className="t">Atelier Vert</div>
        </div>
      </div>

      <div className="dcard">
        <div className="dlbl">Notifications</div>
        <div className="srow">
          <span className="rk">Brief rempli par un client</span>
          <span
            className={`toggle ${tog.a ? "on" : ""}`}
            onClick={() => setTog((s) => ({ ...s, a: !s.a }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setTog((s) => ({ ...s, a: !s.a }));
            }}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setTog((s) => ({ ...s, b: !s.b }));
            }}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setTog((s) => ({ ...s, c: !s.c }));
            }}
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
    </div>
  );
}

function SendSheet({ onClose }) {
  const [copied, setCopied] = useState(false);
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
          <input id="wp-client-name" placeholder="Ex. Famille Roux" />
        </div>
        <div className="field">
          <label htmlFor="wp-client-phone">Téléphone</label>
          <input id="wp-client-phone" placeholder="06 …" />
        </div>
        <div className="field">
          <label htmlFor="wp-client-addr">Adresse (facultatif)</label>
          <input id="wp-client-addr" placeholder="Ville, code postal…" />
        </div>
        <div className="linkbox">
          <span className="u">wilder.pro/b/atelier-vert/8f3a2c</span>
          <button type="button" onClick={() => setCopied(true)}>
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
        <div className="sendrow">
          <button type="button">SMS</button>
          <button type="button">E-mail</button>
          <button type="button">QR code</button>
        </div>
        <div className="note">
          Le brief revient <b>directement dans votre app</b>, avec le nom et les
          coordonnées du client. Rien à ressaisir.
        </div>
        <button className="bigbtn" onClick={onClose} type="button">
          <Send size={18} /> Envoyer le lien
        </button>
      </div>
    </div>
  );
}

export default function WilderProV2() {
  const [tab, setTab] = useState("accueil");
  const [active, setActive] = useState(null);
  const [sheet, setSheet] = useState(false);
  const open = (b) => {
    setActive(b);
    setTab("detail");
  };

  return (
    <div className="wp">
      <div className="phone">
        <div className="screen">
          {tab === "accueil" && (
            <Accueil
              onSend={() => setSheet(true)}
              onBriefs={() => setTab("briefs")}
              onOpen={open}
              onAgenda={() => setTab("agenda")}
            />
          )}
          {tab === "briefs" && <Briefs onOpen={open} />}
          {tab === "detail" && active && (
            <Detail
              b={active}
              onBack={() => setTab("briefs")}
              onPdf={() => {}}
            />
          )}
          {tab === "agenda" && <Agenda />}
          {tab === "profil" && <Profil />}
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

        {sheet && <SendSheet onClose={() => setSheet(false)} />}
      </div>
    </div>
  );
}
