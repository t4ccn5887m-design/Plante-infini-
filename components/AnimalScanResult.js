import { isProtectedSpecies } from "@/lib/animaux";
import DiscoveryAnalysisSections from "@/components/DiscoveryAnalysisSections";

export default function AnimalScanResult({
  result,
  photo,
  t,
  onBack,
  saved = true,
}) {
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

        <DiscoveryAnalysisSections data={result} t={t} />

        <p
          className={`animaux-scan-protection animaux-scan-protection--${
            protectedSpecies ? "protected" : "common"
          }`}
        >
          {protectedSpecies
            ? t("themes.juniors.protected")
            : t("themes.juniors.common")}
        </p>

      </div>

      {saved && (
        <p className="animaux-scan-saved" aria-live="polite">
          ✓ {t("themes.juniors.saved_auto")}
        </p>
      )}
    </div>
  );
}
