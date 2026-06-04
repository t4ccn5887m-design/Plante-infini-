import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";
import { getJardinActionLabel } from "@/lib/espaceVertAction";
import DiscoveryAnalysisSections from "@/components/DiscoveryAnalysisSections";
import DiscoveryResultActions from "@/components/DiscoveryResultActions";

export default function JardinScanResult({
  result,
  photo,
  discovery,
  t,
  lang,
  onBack,
  onScanAgain,
  onOrganizeDestination,
  organizeHint,
  saved = true,
}) {
  const health = inferHealthFromEtatSante(result?.etat_sante);
  const action = getJardinActionLabel(result, t);

  const healthClass =
    health === HEALTH.critical
      ? "critical"
      : health === HEALTH.warning
        ? "warning"
        : "good";

  return (
    <div className="jardin-scan-result screen-enter">
      <button
        type="button"
        className="jardin-scan-back"
        onClick={onBack}
        aria-label={t("themes.jardin.back_to_garden")}
      >
        ← {t("themes.jardin.back_to_garden")}
      </button>

      {photo && (
        <div className="jardin-scan-photo-wrap">
          <img src={photo} alt="" className="jardin-scan-photo" />
        </div>
      )}

      <div className="jardin-scan-content">
        <h1 className="jardin-scan-name">{result.nom}</h1>
        {result.nom_latin && (
          <p className="jardin-scan-latin">{result.nom_latin}</p>
        )}

        <DiscoveryAnalysisSections data={result} t={t} />

        <p className={`jardin-scan-health jardin-scan-health--${healthClass}`}>
          {t(`themes.jardin.health_status_${health}`)}
        </p>

        <div className="jardin-scan-action-card">
          <p className="jardin-scan-action-label">{t("themes.jardin.action_label")}</p>
          <p className="jardin-scan-action">{action}</p>
        </div>

        <DiscoveryResultActions
          discovery={discovery}
          t={t}
          lang={lang}
          organizeHint={organizeHint}
          onOrganizeDestination={onOrganizeDestination}
          onScanAgain={onScanAgain}
        />
      </div>

      {saved && (
        <p className="jardin-scan-saved" aria-live="polite">
          ✓ {t("themes.jardin.saved_auto")}
        </p>
      )}
    </div>
  );
}
