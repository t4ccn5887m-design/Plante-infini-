import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  Leaf,
  Sparkles,
  X,
} from "lucide-react";

const TOTAL_STEPS = 9; // 0..8

const TASTES = [
  { id: "medit", label: "Méditerranéen", tone: "t-medit" },
  { id: "contemporain", label: "Contemporain", tone: "t-contemp" },
  { id: "naturel", label: "Naturel / champêtre", tone: "t-naturel" },
  { id: "japonais", label: "Japonais zen", tone: "t-japon" },
  { id: "luxuriant", label: "Luxuriant", tone: "t-lux" },
  { id: "sec", label: "Jardin sec", tone: "t-sec" },
];

const PLANTS = [
  "Graminées",
  "Olivier",
  "Arbres",
  "Fleuri",
  "Sec / résistant",
  "Lavande",
  "Arbustes",
  "Vivaces",
  "Aromatiques",
  "Haie / intimité",
];

const MATERIALS = [
  "Pierre",
  "Bois",
  "Gravier clair",
  "Terre cuite",
  "Corten",
  "Béton clair",
  "Paillage",
  "Métal",
];

const PRIORITIES = [
  { id: "detente", emoji: "😌", label: "Se détendre" },
  { id: "recevoir", emoji: "🥂", label: "Recevoir" },
  { id: "isoler", emoji: "🌿", label: "S'isoler" },
  { id: "nature", emoji: "🦋", label: "La nature" },
  { id: "beaute", emoji: "✨", label: "Le beau au quotidien" },
  { id: "enfants", emoji: "🧒", label: "Jouer / enfants" },
];

const USERS = [
  { id: "nous", emoji: "🏠", label: "Juste nous" },
  { id: "enfants", emoji: "👶", label: "Enfants" },
  { id: "animaux", emoji: "🐕", label: "Animaux" },
  { id: "ages", emoji: "🤍", label: "Personnes âgées" },
  { id: "invites", emoji: "🎉", label: "On reçoit souvent" },
];

const MAINTENANCE = [
  {
    id: "min",
    title: "Le moins possible",
    sub: "Je veux profiter, pas jardiner",
  },
  {
    id: "weekend",
    title: "Un peu le week-end",
    sub: "Quelques gestes, sans contrainte",
  },
  {
    id: "love",
    title: "J'adore ça",
    sub: "Je suis prêt·e à m'en occuper",
  },
];

const BUDGETS = [
  { id: "lt3", label: "< 3 k€" },
  { id: "3-5", label: "3–5 k€" },
  { id: "5-10", label: "5–10 k€" },
  { id: "10-20", label: "10–20 k€" },
  { id: "20+", label: "20 k€ +" },
  { id: "unknown", label: "Je ne sais pas" },
];

const EMPTY_ANSWERS = {
  tastes: [],
  plants: [],
  materials: [],
  priorities: [],
  users: [],
  maintenance: null,
  photos: [],
  budget: null,
  message: "",
};

function storageKey(token) {
  return `wp-client-brief-${token || "test"}`;
}

function toggleInList(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProgressBar({ step }) {
  const pct = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  return (
    <div className="bf-progress" aria-label={`Étape ${step + 1} sur ${TOTAL_STEPS}`}>
      <div className="bf-progress-track">
        <div className="bf-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="bf-progress-meta">
        <span>
          {step + 1} / {TOTAL_STEPS}
        </span>
        <span>{pct} %</span>
      </div>
    </div>
  );
}

function StepShell({
  step,
  studio,
  title,
  subtitle,
  badge,
  children,
  onBack,
  onNext,
  nextLabel = "Continuer",
  nextDisabled = false,
  skipLabel,
  onSkip,
  hideNext = false,
}) {
  return (
    <div className="bf-step">
      <ProgressBar step={step} />
      <div className="bf-studio-chip">
        <span className="bf-studio-ava" style={{ background: studio.color }}>
          {studio.initials}
        </span>
        <span>{studio.name}</span>
      </div>
      {badge ? <div className="bf-badge">{badge}</div> : null}
      <h1 className="bf-title">{title}</h1>
      {subtitle ? <p className="bf-sub">{subtitle}</p> : null}
      <div className="bf-body">{children}</div>
      <div className="bf-nav">
        {onBack ? (
          <button type="button" className="bf-btn ghost" onClick={onBack}>
            <ArrowLeft size={18} /> Retour
          </button>
        ) : (
          <span />
        )}
        <div className="bf-nav-right">
          {skipLabel && onSkip ? (
            <button type="button" className="bf-btn text" onClick={onSkip}>
              {skipLabel}
            </button>
          ) : null}
          {!hideNext ? (
            <button
              type="button"
              className="bf-btn primary"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Welcome({ studio, onStart }) {
  return (
    <div className="bf-step bf-welcome">
      <ProgressBar step={0} />
      <div
        className="bf-welcome-hero"
        style={{
          background: `linear-gradient(150deg, ${studio.color}, #1F2F1D)`,
        }}
      >
        <div className="bf-welcome-logo">{studio.initials}</div>
        <p className="bf-welcome-kicker">Préparez votre rendez-vous avec</p>
        <h1>{studio.name}</h1>
        <p className="bf-welcome-lead">
          En <strong>3 minutes</strong>, aidez {studio.contactFirstName} à
          comprendre ce que vous imaginez — avant même le premier RDV.
        </p>
      </div>
      <ul className="bf-reassure">
        <li>
          <Check size={18} /> Sans compte
        </li>
        <li>
          <Check size={18} /> Sans téléchargement
        </li>
        <li>
          <Check size={18} /> Vos réponses vont directement à{" "}
          {studio.contactFirstName}
        </li>
      </ul>
      <button type="button" className="bf-btn primary full" onClick={onStart}>
        C&apos;est parti
      </button>
    </div>
  );
}

function TasteStep({ answers, setAnswers, ...shell }) {
  const count = answers.tastes.length;
  return (
    <StepShell
      {...shell}
      title="Quelles ambiances vous parlent ?"
      subtitle="Touchez tout ce qui vous inspire — pas besoin de choisir une seule voie."
      badge={
        <>
          Plusieurs choix possibles
          {count > 0 ? ` · ${count}` : ""}
        </>
      }
      nextDisabled={count === 0}
    >
      <div className="bf-taste-grid">
        {TASTES.map((t) => {
          const on = answers.tastes.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={`bf-taste ${t.tone} ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  tastes: toggleInList(a.tastes, t.id),
                }))
              }
            >
              <span className="bf-taste-check">{on ? <Check size={16} /> : null}</span>
              <span className="bf-taste-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function PlantsMaterialsStep({ answers, setAnswers, ...shell }) {
  const count = answers.plants.length + answers.materials.length;
  return (
    <StepShell
      {...shell}
      title="Végétaux & matières"
      subtitle="Ce que vous aimeriez voir — le placement, c'est le métier du paysagiste."
      badge={
        <>
          Plusieurs choix possibles
          {count > 0 ? ` · ${count}` : ""}
        </>
      }
      nextDisabled={count === 0}
    >
      <div className="bf-section-label">
        <Leaf size={14} /> Végétaux
      </div>
      <div className="bf-chips">
        {PLANTS.map((p) => {
          const on = answers.plants.includes(p);
          return (
            <button
              key={p}
              type="button"
              className={`bf-chip ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  plants: toggleInList(a.plants, p),
                }))
              }
            >
              {p}
            </button>
          );
        })}
      </div>
      <div className="bf-section-label">Matières & couleurs</div>
      <div className="bf-chips">
        {MATERIALS.map((m) => {
          const on = answers.materials.includes(m);
          return (
            <button
              key={m}
              type="button"
              className={`bf-chip mat ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  materials: toggleInList(a.materials, m),
                }))
              }
            >
              {m}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function PrioritiesStep({ answers, setAnswers, ...shell }) {
  const count = answers.priorities.length;
  return (
    <StepShell
      {...shell}
      title="Vos priorités"
      subtitle="Ce qui compte le plus pour votre jardin."
      badge={
        <>
          Plusieurs choix possibles
          {count > 0 ? ` · ${count}` : ""}
        </>
      }
      nextDisabled={count === 0}
    >
      <div className="bf-prio-grid">
        {PRIORITIES.map((p) => {
          const on = answers.priorities.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              className={`bf-prio ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  priorities: toggleInList(a.priorities, p.id),
                }))
              }
            >
              <span className="bf-prio-emoji">{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function UsersStep({ answers, setAnswers, ...shell }) {
  const count = answers.users.length;
  return (
    <StepShell
      {...shell}
      title="Qui utilise le jardin ?"
      subtitle="Ça change les choix (sécurité, circulation, intimité…)."
      badge={
        <>
          Plusieurs choix possibles
          {count > 0 ? ` · ${count}` : ""}
        </>
      }
      nextDisabled={count === 0}
    >
      <div className="bf-prio-grid">
        {USERS.map((u) => {
          const on = answers.users.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              className={`bf-prio ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  users: toggleInList(a.users, u.id),
                }))
              }
            >
              <span className="bf-prio-emoji">{u.emoji}</span>
              <span>{u.label}</span>
            </button>
          );
        })}
      </div>
      <p className="bf-hint">
        Exemple : avec un chien et des enfants, {shell.studio.contactFirstName}{" "}
        pensera circulation et plantes robustes dès le premier échange.
      </p>
    </StepShell>
  );
}

function MaintenanceStep({ answers, setAnswers, ...shell }) {
  return (
    <StepShell
      {...shell}
      title="L'entretien, pour vous ?"
      subtitle="Une seule réponse — on affine plus tard sur place."
      nextDisabled={!answers.maintenance}
    >
      <div className="bf-single-list">
        {MAINTENANCE.map((m) => {
          const on = answers.maintenance === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`bf-single ${on ? "on" : ""}`}
              onClick={() => setAnswers((a) => ({ ...a, maintenance: m.id }))}
            >
              <span className="bf-single-radio">{on ? <Check size={16} /> : null}</span>
              <span>
                <span className="bf-single-title">{m.title}</span>
                <span className="bf-single-sub">{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function PhotosStep({ answers, setAnswers, ...shell }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const maxPhotos = 4;

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(
      0,
      maxPhotos - answers.photos.length
    );
    if (!files.length) return;
    const urls = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        urls.push(await readImageAsDataUrl(file));
      } catch {
        /* ignore bad files */
      }
    }
    if (!urls.length) return;
    setAnswers((a) => ({
      ...a,
      photos: [...a.photos, ...urls].slice(0, maxPhotos),
    }));
  };

  const removePhoto = (idx) => {
    setAnswers((a) => ({
      ...a,
      photos: a.photos.filter((_, i) => i !== idx),
    }));
  };

  return (
    <StepShell
      {...shell}
      title="Photos de votre terrain"
      subtitle="Facultatif — même une photo floue aide beaucoup."
      badge="FACULTATIF"
      skipLabel={answers.photos.length ? "Passer" : undefined}
      nextLabel={answers.photos.length ? "Continuer" : "Passer"}
    >
      <p className="bf-hint calm">
        Aucune obligation. Vous pourrez aussi les montrer le jour du RDV.
      </p>
      <div className="bf-photo-actions">
        <button
          type="button"
          className="bf-btn secondary"
          onClick={() => cameraRef.current?.click()}
          disabled={answers.photos.length >= maxPhotos}
        >
          <Camera size={18} /> Caméra
        </button>
        <button
          type="button"
          className="bf-btn secondary"
          onClick={() => galleryRef.current?.click()}
          disabled={answers.photos.length >= maxPhotos}
        >
          <ImagePlus size={18} /> Galerie
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {answers.photos.length > 0 ? (
        <div className="bf-photo-grid">
          {answers.photos.map((src, i) => (
            <div className="bf-photo" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo terrain ${i + 1}`} />
              <button
                type="button"
                className="bf-photo-x"
                onClick={() => removePhoto(i)}
                aria-label="Supprimer la photo"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bf-photo-empty">
          Jusqu&apos;à {maxPhotos} photos · caméra ou galerie
        </div>
      )}
    </StepShell>
  );
}

function BudgetStep({ answers, setAnswers, studio, onSubmit, ...shell }) {
  return (
    <StepShell
      {...shell}
      title="Budget & un mot"
      subtitle="Toujours facultatif — ça aide juste à cadrer la conversation."
      badge="FACULTATIF"
      skipLabel="Passer et envoyer"
      onSkip={onSubmit}
      nextLabel="Envoyer mon brief"
      onNext={onSubmit}
      hideNext={false}
    >
      <div className="bf-section-label">Fourchette budgétaire</div>
      <div className="bf-chips">
        {BUDGETS.map((b) => {
          const on = answers.budget === b.id;
          return (
            <button
              key={b.id}
              type="button"
              className={`bf-chip ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  budget: a.budget === b.id ? null : b.id,
                }))
              }
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <div className="bf-section-label">
        Un mot pour {studio.contactFirstName} ?
      </div>
      <textarea
        className="bf-textarea"
        rows={4}
        placeholder="Ce que vous voulez qu'il retienne… (optionnel)"
        value={answers.message}
        onChange={(e) =>
          setAnswers((a) => ({ ...a, message: e.target.value }))
        }
      />
    </StepShell>
  );
}

function Thanks({ studio }) {
  return (
    <div className="bf-step bf-thanks">
      <ProgressBar step={8} />
      <div className="bf-thanks-icon">
        <Sparkles size={28} />
      </div>
      <h1 className="bf-title">
        Envoyé à {studio.name}&nbsp;!
      </h1>
      <p className="bf-sub">
        {studio.contactFirstName} reçoit votre brief. Vous pourrez en parler
        sereinement au premier rendez-vous.
      </p>
      <ul className="bf-benefits">
        <li>
          <Check size={18} /> Gardez une trace de vos envies
        </li>
        <li>
          <Check size={18} /> Enrichissez votre brief quand vous voulez
        </li>
        <li>
          <Check size={18} /> Scannez des plantes et constituez votre carnet
        </li>
      </ul>
      <Link href="/" className="bf-btn primary full">
        Créer mon carnet gratuit →
      </Link>
      <p className="bf-thanks-foot">
        Gratuit · pour aller plus loin après ce premier brief
      </p>
    </div>
  );
}

export default function ClientBriefFlow({ token, studio }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(token));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers) setAnswers({ ...EMPTY_ANSWERS, ...parsed.answers });
        if (typeof parsed?.step === "number" && parsed.step >= 0 && parsed.step <= 8) {
          setStep(parsed.step);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        storageKey(token),
        JSON.stringify({
          token,
          studioName: studio.name,
          step,
          answers: {
            ...answers,
            // keep photos in storage for demo; may be large
            photos: answers.photos,
          },
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      /* quota — ignore */
    }
  }, [answers, step, token, studio.name, hydrated]);

  const go = useCallback((n) => setStep(n), []);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => setStep((s) => Math.min(8, s + 1)), []);

  const submit = useCallback(() => {
    try {
      const payload = {
        token,
        studio,
        answers,
        submittedAt: new Date().toISOString(),
        status: "mock-submitted",
      };
      localStorage.setItem(
        `wp-client-brief-submitted-${token}`,
        JSON.stringify(payload)
      );
      localStorage.setItem(
        storageKey(token),
        JSON.stringify({
          token,
          studioName: studio.name,
          step: 8,
          answers,
          submitted: true,
          updatedAt: payload.submittedAt,
        })
      );
    } catch {
      /* ignore */
    }
    setStep(8);
  }, [answers, studio, token]);

  const shellBase = useMemo(
    () => ({
      studio,
      onBack: back,
      onNext: next,
    }),
    [studio, back, next]
  );

  if (!hydrated) {
    return (
      <div className="wp wp-brief">
        <div className="phone">
          <div className="bf-loading">Chargement…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wp wp-brief">
      <div className="phone">
        <div className="bf-screen">
          {step === 0 && (
            <Welcome studio={studio} onStart={() => go(1)} />
          )}
          {step === 1 && (
            <TasteStep
              {...shellBase}
              step={1}
              answers={answers}
              setAnswers={setAnswers}
              onBack={() => go(0)}
            />
          )}
          {step === 2 && (
            <PlantsMaterialsStep
              {...shellBase}
              step={2}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}
          {step === 3 && (
            <PrioritiesStep
              {...shellBase}
              step={3}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}
          {step === 4 && (
            <UsersStep
              {...shellBase}
              step={4}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}
          {step === 5 && (
            <MaintenanceStep
              {...shellBase}
              step={5}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}
          {step === 6 && (
            <PhotosStep
              {...shellBase}
              step={6}
              answers={answers}
              setAnswers={setAnswers}
              onSkip={next}
            />
          )}
          {step === 7 && (
            <BudgetStep
              {...shellBase}
              step={7}
              answers={answers}
              setAnswers={setAnswers}
              studio={studio}
              onSubmit={submit}
            />
          )}
          {step === 8 && <Thanks studio={studio} />}
        </div>
      </div>
    </div>
  );
}
