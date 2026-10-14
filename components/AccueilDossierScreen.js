import { useEffect, useMemo, useState } from "react";
import AtelierProgressRing from "@/components/atelier/AtelierProgressRing";
import AtelierStepRow from "@/components/atelier/AtelierStepRow";
import SevyaTopBar from "@/components/SevyaTopBar";
import { getAllGardenStyles } from "@/lib/catalogueStyles";
import { computeGardenDossierProgress } from "@/lib/gardenDossierProgress";
import { readGardenDossierLocalFlags } from "@/lib/gardenDossierLocal";
import { loadGardenBriefDetails } from "@/lib/gardenBriefDetails";
import { DOSSIER_STEP_CARD } from "@/lib/gardenDossierStepCards";
import { firstIncompleteStepId, stepShortLabel } from "@/lib/gardenDossierGuidance";
import { loadClientContact } from "@/lib/clientContact";
import { ATELIER_HERO_JARDIN } from "@/lib/atelierHeroImages";

export default function AccueilDossierScreen({
  loading,
  gardenItems = [],
  paysagisteMessage = "",
  accountMenu = null,
  userInitials = null,
  onOpenDossier,
  onOpenCoupsDeCoeur,
  onOpenIdees,
  onOpenAmbiances,
  onOpenTerrain,
  onOpenBudget,
  onContinueDossier,
  onOpenMot,
  onOpenQuotidien,
  onOpenAEviter,
  onOpenExistant,
  onOpenEntretien,
  gardenRefreshTick = 0,
}) {
  const [cityLabel, setCityLabel] = useState("");

  useEffect(() => {
    loadClientContact()
      .then((c) => {
        const city = c?.city?.trim();
        setCityLabel(city || "");
      })
      .catch(() => setCityLabel(""));
  }, [gardenRefreshTick]);

  const localFlags = useMemo(() => readGardenDossierLocalFlags(), [gardenRefreshTick]);

  const progress = useMemo(
    () =>
      computeGardenDossierProgress({
        gardenItemCount: gardenItems.length,
        paysagisteMessage,
        ambianceComplete: localFlags.ambianceComplete,
        terrainComplete: localFlags.terrainPhotosComplete && localFlags.terrainFieldsComplete,
        budgetComplete: localFlags.budgetComplete,
        details: loadGardenBriefDetails(),
      }),
    [gardenItems.length, paysagisteMessage, localFlags, gardenRefreshTick]
  );

  const heroPhotoUrl = useMemo(() => {
    const styles = getAllGardenStyles();
    const pick = styles.find((s) => s.origin === "realisation") || styles[0];
    return pick?.photo_url || ATELIER_HERO_JARDIN;
  }, []);

  const nextStepId = firstIncompleteStepId(progress);
  const nextLabel = nextStepId ? stepShortLabel(nextStepId) : null;

  const progressLine = (() => {
    const done = progress.completedCount;
    const total = progress.totalSteps;
    const stepWord = done > 1 ? "étapes" : "étape";
    if (nextLabel) {
      return (
        <>
          <b>
            {done} {stepWord} sur {total}.
          </b>
          <br />
          Prochaine étape : {nextLabel.toLowerCase()}.
        </>
      );
    }
    return (
      <>
        <b>
          {done} {stepWord} sur {total}.
        </b>
        <br />
        Votre dossier est prêt à être envoyé.
      </>
    );
  })();

  const handleStep = (stepId) => {
    if (stepId === "terrain") onOpenTerrain?.();
    else if (stepId === "ambiance") onOpenAmbiances?.();
    else if (stepId === "coups-de-coeur") onOpenIdees?.();
    else if (stepId === "budget") onOpenBudget?.();
    else if (stepId === "mot-paysagiste") onOpenMot?.();
    else if (stepId === "quotidien") onOpenQuotidien?.();
    else if (stepId === "a-eviter") onOpenAEviter?.();
    else if (stepId === "existant") onOpenExistant?.();
    else if (stepId === "entretien") onOpenEntretien?.();
  };

  if (loading) {
    return (
      <div className="atelier-jardin-loading" role="status">
        Chargement…
      </div>
    );
  }

  const projectTag = cityLabel ? `VOTRE PROJET · ${cityLabel.toUpperCase()}` : "VOTRE PROJET";

  return (
    <div className="atelier-jardin-accueil">
      <SevyaTopBar rightSlot={accountMenu} initials={!accountMenu ? userInitials : null} />

      <div className="atelier-jardin-hero tile-g">
        <img className="atelier-jardin-hero__img" src={heroPhotoUrl} alt="" />
        <div className="atelier-jardin-hero__shade" aria-hidden="true" />
        <div className="atelier-jardin-hero__cap">
          <span className="atelier-label atelier-label--sage">{projectTag}</span>
          <h1 className="atelier-jardin-hero__title">
            Un jardin qui vous ressemble, avant même le premier rendez-vous.
          </h1>
          <button
            type="button"
            className="atelier-jardin-hero__cta"
            onClick={progress.percent >= 100 ? onOpenDossier : onContinueDossier || onOpenDossier}
          >
            {progress.percent >= 100 ? "Voir mon dossier →" : "Continuer mon dossier →"}
          </button>
        </div>
      </div>

      <div className="atelier-jardin-progress">
        <AtelierProgressRing percent={progress.percent} />
        <p className="atelier-jardin-progress__text">{progressLine}</p>
      </div>

      <div className="atelier-lines atelier-lines--steps">
        {progress.steps.map((step, index) => {
          const meta = DOSSIER_STEP_CARD[step.id];
          return (
            <AtelierStepRow
              key={step.id}
              index={index + 1}
              title={meta?.title || step.label}
              statusLabel={step.complete ? "Fait" : "À faire →"}
              done={step.complete}
              onClick={() => handleStep(step.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
