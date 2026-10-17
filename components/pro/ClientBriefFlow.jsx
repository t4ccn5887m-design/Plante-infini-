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
import StepAEviter, { isAEviterValid } from "@/components/brief/StepAEviter";
import StepEntretien, { isEntretienValid } from "@/components/brief/StepEntretien";
import StepExistant, { isExistantValid } from "@/components/brief/StepExistant";
import StepQuotidien, { isQuotidienValid } from "@/components/brief/StepQuotidien";
import {
  EMPTY_BRIEF_DETAILS,
  normalizeBriefDetails,
} from "@/lib/brief/briefDetails";
import {
  AREA_RANGES,
  BUDGETS,
  MATERIALS as MATERIAL_DEFS,
  PLANTS as PLANT_DEFS,
  TASTES as TASTE_DEFS,
  UTILITIES,
} from "@/lib/pro/briefLabels";
import {
  clientBriefErrorMessage,
  submitClientBrief,
} from "@/lib/pro/clientBriefApi";
import ClientBriefPreviewBanner from "@/components/pro/ClientBriefPreviewBanner";
import { SEVYA_DEMO_RENDU_3D } from "@/lib/sevyaDemoRenders";

const QUESTION_STEPS = 9;
const THANKS_STEP = 10;

const TASTES = TASTE_DEFS.map((t) => ({
  ...t,
  image: BRIEF_AMBIANCE_IMAGES[t.id],
}));

/** Choix simplifiés — parlants pour un particulier, pas un catalogue pro. */
const PLANTS = PLANT_DEFS.map((p) => ({
  ...p,
  image: BRIEF_CHOICE_IMAGES[p.id],
}));

const MATERIALS = MATERIAL_DEFS.map((m) => ({
  ...m,
  image: BRIEF_CHOICE_IMAGES[m.id],
}));

const EMPTY_ANSWERS = {
  tastes: [],
  plants: [],
  materials: [],
  priorities: [],
  users: [],
  maintenance: null,
  photos: [],
  areaRange: null,
  timeline: null,
  utilities: null,
  budget: null,
  message: "",
  details: EMPTY_BRIEF_DETAILS,
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
  for (const key of ["areaRange", "timeline", "utilities"]) {
    if (merged[key] != null && typeof merged[key] !== "string") {
      merged[key] = null;
    }
  }
  if (typeof merged.message !== "string") merged.message = "";
  merged.details = normalizeBriefDetails(merged.details);
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
  const q =
    step <= 0 ? 0 : step >= THANKS_STEP ? QUESTION_STEPS : Math.min(step, QUESTION_STEPS);
  const pct = Math.round((q / QUESTION_STEPS) * 100);
  return (
    <div className="bf-progress" aria-label={`Étape ${q} sur ${QUESTION_STEPS}`}>
      <div className="bf-progress-track">
        <div className="bf-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="bf-progress-meta">
        <span>
          {q} / {QUESTION_STEPS}
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
  const studioColor = studio?.color || "#C9D6B8";
  const contact = studio?.contactFirstName || "votre paysagiste";
  return (
    <div className="bf-step bf-welcome">
      <ProgressBar step={0} />
      <div className="bf-welcome-card">
        <div className="bf-welcome-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="bf-welcome-hero-img"
            src={SEVYA_DEMO_RENDU_3D}
            alt=""
          />
        </div>
        <div className="bf-welcome-body">
          <div
            className="bf-welcome-logo"
            style={{ background: studioColor, color: "var(--bg)" }}
          >
            {studio.initials}
          </div>
          <h1 className="bf-welcome-headline">
            {contact}, de {studio.name}, vous invite à préparer votre jardin.
          </h1>
          <p className="bf-welcome-lead">
            En <strong>3 minutes</strong>, sans compte — choisissez ce qui vous
            plaît, montrez votre terrain : {contact} arrivera au rendez-vous
            avec des idées pour vous.
          </p>
        </div>
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
      title="Vos coups de cœur"
      subtitle="Touchez tout ce qui vous inspire — plusieurs choix possibles."
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
      title="Ambiance"
      subtitle="Végétaux et matières qui vous parlent — le placement, c'est le métier du paysagiste."
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

function MessageStep({ answers, setAnswers, ...shell }) {
  const message = typeof answers.message === "string" ? answers.message : "";
  const ok = message.trim().length >= 4;
  return (
    <StepShell
      {...shell}
      title="En quelques mots, votre jardin idéal ?"
      subtitle="Ce que vous voulez y faire, ce qui compte pour vous."
      nextDisabled={!ok}
    >
      <textarea
        className="bf-textarea"
        rows={5}
        placeholder="Ex. : un jardin facile à entretenir où mes enfants peuvent jouer…"
        value={message}
        onChange={(e) => setAnswers((a) => ({ ...a, message: e.target.value }))}
      />
    </StepShell>
  );
}

function TerrainPhotosFields({ answers, setAnswers }) {
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
    <>
      <p className="bf-hint calm">
        2 ou 3 photos suffisent, de loin si possible. Vous pourrez aussi les
        montrer le jour du RDV.
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
    </>
  );
}

function TerrainStep({ answers, setAnswers, ...shell }) {
  return (
    <StepShell
      {...shell}
      title="Montrez-nous votre jardin"
      subtitle="Photos et quelques infos — tout est facultatif, mais ça aide beaucoup."
      badge="FACULTATIF"
      skipLabel="Passer"
      onSkip={shell.onNext}
    >
      <TerrainPhotosFields answers={answers} setAnswers={setAnswers} />
      <div className="bf-section-label">Quelle surface souhaitez-vous aménager ?</div>
      <p className="bf-hint calm">
        Pas la taille du terrain — juste la partie à transformer.
      </p>
      <div className="bf-chips">
        {AREA_RANGES.map((o) => {
          const on = answers.areaRange === o.id;
          return (
            <button
              key={o.id}
              type="button"
              className={`bf-chip ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  areaRange: a.areaRange === o.id ? null : o.id,
                }))
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="bf-section-label">
        Avez-vous un point d&apos;eau et de l&apos;électricité au jardin ?
      </div>
      <p className="bf-hint calm">Utile pour l&apos;arrosage et l&apos;éclairage.</p>
      <div className="bf-chips">
        {UTILITIES.map((o) => {
          const on = answers.utilities === o.id;
          return (
            <button
              key={o.id}
              type="button"
              className={`bf-chip ${on ? "on" : ""}`}
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  utilities: a.utilities === o.id ? null : o.id,
                }))
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
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
  preview = false,
  ...shell
}) {
  return (
    <StepShell
      {...shell}
      studio={studio}
      title="Quel budget imaginez-vous ?"
      subtitle="Une fourchette, juste pour orienter votre paysagiste."
      badge="FACULTATIF"
      skipLabel={
        preview || submitting ? undefined : "Passer et envoyer"
      }
      onSkip={preview || submitting ? undefined : onSubmit}
      nextLabel={
        preview ? "Aperçu pro" : submitting ? "Envoi…" : "Envoyer mon brief"
      }
      onNext={preview ? undefined : onSubmit}
      nextDisabled={preview || submitting}
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
      {preview ? (
        <p className="bc-taste" style={{ marginTop: 12 }}>
          Aperçu pro : rien n&apos;est envoyé au studio.
        </p>
      ) : null}
      {submitError ? <p className="bf-submit-error">{submitError}</p> : null}
    </StepShell>
  );
}

function Thanks({ studio }) {
  return (
    <div className="bf-step bf-thanks">
      <ProgressBar step={THANKS_STEP} />
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
        <Link href="/jardin" className="bf-btn primary full">
          Créer mon carnet Amont →
        </Link>
        <p className="bf-thanks-foot">
          Gratuit · pour aller plus loin après ce premier brief
        </p>
      </div>
    </div>
  );
}

export default function ClientBriefFlow({ token, studio, preview = false }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (preview) {
      setHydrated(true);
      return;
    }
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
          parsed.step <= QUESTION_STEPS
        ) {
          setStep(parsed.step);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [token, preview]);

  useEffect(() => {
    if (preview || !hydrated) return;
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
  }, [answers, step, token, studio.name, hydrated, preview]);

  const go = useCallback((n) => setStep(n), []);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const next = useCallback(
    () => setStep((s) => Math.min(QUESTION_STEPS, s + 1)),
    []
  );

  const patchDetails = useCallback((updater) => {
    setAnswers((a) => ({
      ...a,
      details: updater(normalizeBriefDetails(a.details)),
    }));
  }, []);

  const submit = useCallback(async () => {
    if (preview) return;
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
            step: THANKS_STEP,
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
      setStep(THANKS_STEP);
    } catch (e) {
      console.error("[Wilder Pro] submit:", e);
      setSubmitError(clientBriefErrorMessage("submit_failed"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [answers, studio.name, token, preview]);

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
      {preview ? <ClientBriefPreviewBanner /> : null}
      <div className="phone">
        <div className={`bf-screen${preview ? " bf-screen-preview" : ""}`}>
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
            <MessageStep
              {...shellBase}
              step={3}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}
          {step === 4 && (
            <StepShell
              {...shellBase}
              step={4}
              title="Qui va vivre ce jardin ?"
              subtitle="Pour qu'il soit pensé pour vous, pas pour une photo."
              nextDisabled={!isQuotidienValid(answers.details)}
            >
              <StepQuotidien
                details={answers.details}
                onDetailsChange={patchDetails}
              />
            </StepShell>
          )}
          {step === 5 && (
            <StepShell
              {...shellBase}
              step={5}
              title="Ce que vous ne voulez pas"
              subtitle="Aussi utile que ce que vous aimez. Plusieurs choix possibles."
              nextDisabled={!isAEviterValid(answers.details)}
            >
              <StepAEviter
                details={answers.details}
                onDetailsChange={patchDetails}
              />
            </StepShell>
          )}
          {step === 6 && (
            <TerrainStep
              {...shellBase}
              step={6}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}
          {step === 7 && (
            <StepShell
              {...shellBase}
              step={7}
              title="Ce qui existe déjà"
              subtitle="Si vous ne savez pas, aucun souci : votre paysagiste verra sur place."
              nextDisabled={!isExistantValid(answers.details)}
            >
              <StepExistant
                details={answers.details}
                onDetailsChange={patchDetails}
              />
            </StepShell>
          )}
          {step === 8 && (
            <StepShell
              {...shellBase}
              step={8}
              title="Entretien et calendrier"
              subtitle="Un jardin se pense aussi pour le temps que vous avez."
              nextDisabled={!isEntretienValid(answers.details)}
            >
              <StepEntretien
                details={answers.details}
                onDetailsChange={patchDetails}
              />
            </StepShell>
          )}
          {step === 9 && (
            <BudgetStep
              {...shellBase}
              step={9}
              answers={answers}
              setAnswers={setAnswers}
              studio={studio}
              preview={preview}
              onSubmit={submit}
              submitting={submitting}
              submitError={submitError}
            />
          )}
          {step === THANKS_STEP && <Thanks studio={studio} />}
        </div>
      </div>
    </div>
  );
}
