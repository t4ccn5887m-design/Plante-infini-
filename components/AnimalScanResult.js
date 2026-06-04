import { buildAnimalStory, isProtectedSpecies } from "@/lib/animaux";

export default function AnimalScanResult({
  result,
  photo,
  t,
  onBack,
  saved = true,
}) {
  const story = buildAnimalStory(result);
  const protectedSpecies = isProtectedSpecies(result);

  return (
    <div className="animaux-scan-result screen-enter">
      <button
        type="button"
        className="animaux-scan-back"
        onClick={onBack}
        aria-label={t("themes.juniors.back_to_animaux")}
      >
        ← {t("themes.juniors.back_to_animaux")}
      </button>

      {photo && (
        <div className="animaux-scan-photo-wrap">
          <img src={photo} alt="" className="animaux-scan-photo" />
        </div>
      )}

      <div className="animaux-scan-content">
        <h1 className="animaux-scan-name">{result.nom}</h1>
        {result.nom_latin && (
          <p className="animaux-scan-latin">{result.nom_latin}</p>
        )}

        {story && <div className="animaux-scan-story">{story}</div>}

        <p
          className={`animaux-scan-protection animaux-scan-protection--${
            protectedSpecies ? "protected" : "common"
          }`}
        >
          {protectedSpecies
            ? t("themes.juniors.protected")
            : t("themes.juniors.common")}
        </p>

        {result.region_saison && (
          <div className="animaux-scan-region-card">
            <p className="animaux-scan-region-label">{t("themes.juniors.region_label")}</p>
            <p className="animaux-scan-region">{result.region_saison}</p>
          </div>
        )}
      </div>

      {saved && (
        <p className="animaux-scan-saved" aria-live="polite">
          ✓ {t("themes.juniors.saved_auto")}
        </p>
      )}
    </div>
  );
}
