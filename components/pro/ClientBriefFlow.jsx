import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  Sparkles,
  X,
} from "lucide-react";
import { BRIEF_AMBIANCE_IMAGES, BRIEF_CHOICE_IMAGES } from "@/lib/pro/briefAmbianceImages";
import {
  clientBriefErrorMessage,
  submitClientBrief,
} from "@/lib/pro/clientBriefApi";

const TOTAL_STEPS = 9; // 0..8

const TASTES = [
  { id: "medit", label: "Méditerranéen", image: BRIEF_AMBIANCE_IMAGES.medit },
  {
    id: "contemporain",
    label: "Contemporain",
    image: BRIEF_AMBIANCE_IMAGES.contemporain,
  },
  {
    id: "naturel",
    label: "Naturel / champêtre",
    image: BRIEF_AMBIANCE_IMAGES.naturel,
  },
  {
    id: "japonais",
    label: "Japonais zen",
    image: BRIEF_AMBIANCE_IMAGES.japonais,
  },
  {
    id: "luxuriant",
    label: "Luxuriant",
    image: BRIEF_AMBIANCE_IMAGES.luxuriant,
  },
  { id: "sec", label: "Jardin sec", image: BRIEF_AMBIANCE_IMAGES.sec },
];

/** Choix simplifiés — parlants pour un particulier, pas un catalogue pro. */
const PLANTS = [
  { id: "fleuri", label: "Fleuri", image: BRIEF_CHOICE_IMAGES.fleuri },
  { id: "arbres", label: "Arbres", image: BRIEF_CHOICE_IMAGES.arbres },
  { id: "graminees", label: "Graminées", image: BRIEF_CHOICE_IMAGES.graminees },
  {
    id: "mediterraneen",
    label: "Méditerranéen",
    image: BRIEF_CHOICE_IMAGES.mediterraneen,
  },
  { id: "sec", label: "Sec / peu d'eau", image: BRIEF_CHOICE_IMAGES.sec },
  { id: "haie", label: "Haie / intimité", image: BRIEF_CHOICE_IMAGES.haie },
];

const MATERIALS = [
  { id: "pierre", label: "Pierre", image: BRIEF_CHOICE_IMAGES.pierre },
  { id: "bois", label: "Bois", image: BRIEF_CHOICE_IMAGES.bois },
  { id: "gravier", label: "Gravier clair", image: BRIEF_CHOICE_IMAGES.gravier },
  {
    id: "terre-cuite",
    label: "Terre cuite",
    image: BRIEF_CHOICE_IMAGES["terre-cuite"],
  },
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

const LIST_KEYS = ["tastes", "plants", "materials", "priorities", "users", "photos"];

function storageKey(token) {
  return `wp-client-brief-${token || "test"}`;
}

function normalizeAnswers(raw) {
  const merged = { ...EMPTY_ANSWERS, ...(raw || {}) };
  for (const key of LIST_KEYS) {
    merged[key] = Array.isArray(merged[key]) ? merged[key] : [];
  }
  if (merged.maintenance != null && typeof merged.maintenance !== "string") {
    merged.maintenance = null;
  }
  if (typeof merged.message !== "string") merged.message = "";
  return merged;
}

function toggleInList(list, id) {
  const safe = Array.isArray(list) ? list : [];
  return safe.includes(id) ? safe.filter((x) => x !== id) : [...safe, id];
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
  const studioColor = studio?.color || "#2F5E3F";
  const studioInitials = studio?.initials || "?";
  const studioName = studio?.name || "Studio";
  return (
    <div className="bf-step">
      <ProgressBar step={step} />
      <div className="bf-studio-chip">
        <span className="bf-studio-ava" style={{ background: studioColor }}>
          {studioInitials}
        </span>
        <span>{studioName}</span>
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
  const tastes = Array.isArray(answers.tastes) ? answers.tastes : [];
  const count = tastes.length;
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
          const on = tastes.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={`bf-taste ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  tastes: toggleInList(a.tastes, t.id),
                }))
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="bf-taste-img" src={t.image} alt="" />
              <span className="bf-taste-shade" />
              <span className="bf-taste-check">
                {on ? <Check size={16} /> : null}
              </span>
              <span className="bf-taste-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function PlantsMaterialsStep({ answers, setAnswers, ...shell }) {
  const plants = Array.isArray(answers.plants) ? answers.plants : [];
  const materials = Array.isArray(answers.materials) ? answers.materials : [];
  const count = plants.length + materials.length;
  return (
    <StepShell
      {...shell}
      title="Végétaux & matières"
      subtitle="Ce qui vous parle d'un coup d'œil — le placement, c'est le métier du paysagiste."
      badge={
        <>
          Plusieurs choix possibles
          {count > 0 ? ` · ${count}` : ""}
        </>
      }
      nextDisabled={count === 0}
    >
      <div className="bf-section-label">Végétaux</div>
      <div className="bf-choice-grid">
        {PLANTS.map((p) => {
          const on = plants.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              className={`bf-choice ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  plants: toggleInList(a.plants, p.id),
                }))
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="bf-choice-img" src={p.image} alt="" />
              <span className="bf-choice-label">{p.label}</span>
            </button>
          );
        })}
      </div>
      <div className="bf-section-label">Matières</div>
      <div className="bf-choice-grid">
        {MATERIALS.map((m) => {
          const on = materials.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={`bf-choice mat ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  materials: toggleInList(a.materials, m.id),
                }))
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="bf-choice-img" src={m.image} alt="" />
              <span className="bf-choice-label">{m.label}</span>
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
  const photos = Array.isArray(answers.photos) ? answers.photos : [];

  const addFiles = async (fileList) => {
    const room = Math.max(0, maxPhotos - photos.length);
    const files = Array.from(fileList || []).slice(0, room);
    if (!files.length) return;
    const urls = [];
    for (const file of files) {
      if (!file.type || !file.type.startsWith("image/")) continue;
      try {
        urls.push(await readImageAsDataUrl(file));
      } catch {
        /* ignore bad files */
      }
    }
    if (!urls.length) return;
    setAnswers((a) => {
      const prev = Array.isArray(a.photos) ? a.photos : [];
      return { ...a, photos: [...prev, ...urls].slice(0, maxPhotos) };
    });
  };

  const removePhoto = (idx) => {
    setAnswers((a) => {
      const prev = Array.isArray(a.photos) ? a.photos : [];
      return { ...a, photos: prev.filter((_, i) => i !== idx) };
    });
  };

  return (
    <StepShell
      {...shell}
      title="Photos de votre terrain"
      subtitle="Facultatif — même une photo floue aide beaucoup."
      badge="FACULTATIF"
      skipLabel={photos.length ? "Passer" : undefined}
      nextLabel={photos.length ? "Continuer" : "Passer"}
    >
      <p className="bf-hint calm">
        Aucune obligation. Vous pourrez aussi les montrer le jour du RDV.
      </p>
      <div className="bf-photo-actions">
        <button
          type="button"
          className="bf-btn secondary"
          onClick={() => cameraRef.current?.click()}
          disabled={photos.length >= maxPhotos}
        >
          <Camera size={18} /> Caméra
        </button>
        <button
          type="button"
          className="bf-btn secondary"
          onClick={() => galleryRef.current?.click()}
          disabled={photos.length >= maxPhotos}
        >
          <ImagePlus size={18} /> Galerie
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="bf-file-input"
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
        className="bf-file-input"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {photos.length > 0 ? (
        <div className="bf-photo-grid">
          {photos.map((src, i) => (
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

function BudgetStep({
  answers,
  setAnswers,
  studio,
  onSubmit,
  submitting = false,
  submitError = null,
  ...shell
}) {
  const message = typeof answers.message === "string" ? answers.message : "";
  return (
    <StepShell
      {...shell}
      studio={studio}
      title="Budget & un mot"
      subtitle="Toujours facultatif — ça aide juste à cadrer la conversation."
      badge="FACULTATIF"
      skipLabel={submitting ? undefined : "Passer et envoyer"}
      onSkip={submitting ? undefined : onSubmit}
      nextLabel={submitting ? "Envoi…" : "Envoyer mon brief"}
      onNext={onSubmit}
      nextDisabled={submitting}
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
              disabled={submitting}
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
        value={message}
        disabled={submitting}
        onChange={(e) =>
          setAnswers((a) => ({ ...a, message: e.target.value }))
        }
      />
      {submitError ? <p className="bf-submit-error">{submitError}</p> : null}
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

      <div className="bf-amont">
        <div className="bf-amont-kicker">Et maintenant</div>
        <h2 className="bf-amont-title">Continuez sur Amont</h2>
        <p className="bf-amont-lead">
          Amont, c&apos;est votre carnet de jardin : scannez des plantes, gardez
          vos envies, et enrichissez votre brief quand vous voulez.
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
          Créer mon carnet Amont →
        </Link>
        <p className="bf-thanks-foot">
          Gratuit · pour aller plus loin après ce premier brief
        </p>
      </div>
    </div>
  );
}

export default function ClientBriefFlow({ token, studio }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(token));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers && !parsed?.submitted) {
          // Photos (data URLs) are session-only — never restore from storage.
          const restored = normalizeAnswers({ ...parsed.answers, photos: [] });
          setAnswers(restored);
        }
        if (
          !parsed?.submitted &&
          typeof parsed?.step === "number" &&
          parsed.step >= 0 &&
          parsed.step <= 7
        ) {
          setStep(parsed.step);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const safe = normalizeAnswers(answers);
      localStorage.setItem(
        storageKey(token),
        JSON.stringify({
          token,
          studioName: studio.name,
          step,
          answers: {
            ...safe,
            // Do not persist data URLs — they blow mobile localStorage quota
            // and can leave corrupt state (e.g. photos: null) after failed writes.
            photos: [],
          },
          photoCount: Array.isArray(safe.photos) ? safe.photos.length : 0,
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

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    const safe = normalizeAnswers(answers);
    try {
      const result = await submitClientBrief(token, safe);
      if (!result.ok) {
        setSubmitError(clientBriefErrorMessage(result.error));
        return;
      }

      try {
        localStorage.setItem(
          storageKey(token),
          JSON.stringify({
            token,
            studioName: studio.name,
            step: 8,
            answers: { ...safe, photos: [] },
            submitted: true,
            briefId: result.briefId,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore quota */
      }

      setAnswers(safe);
      setStep(8);
    } catch (e) {
      console.error("[Wilder Pro] submit:", e);
      setSubmitError(clientBriefErrorMessage("submit_failed"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [answers, studio.name, token]);

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
              submitting={submitting}
              submitError={submitError}
            />
          )}
          {step === 8 && <Thanks studio={studio} />}
        </div>
      </div>
    </div>
  );
}
