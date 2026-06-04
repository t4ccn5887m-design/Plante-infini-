import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";
import { getPotagerActionLabel } from "@/lib/potagerAction";
import DiscoveryAnalysisSections from "@/components/DiscoveryAnalysisSections";
import DiscoveryResultActions from "@/components/DiscoveryResultActions";

export default function PotagerScanResult({
  result,
  photo,
  discovery,
  t,
  lang,
  onBack,
  onScanAgain,
  onOrganizeDestination,
  organizeHint,
}) {
  const health = inferHealthFromEtatSante(result?.etat_sante);
  const action = getPotagerActionLabel(result, t);

  const healthClass =
    health === HEALTH.critical
      ? "critical"
      : health === HEALTH.warning
        ? "warning"
        : "good";

  return (
    <div className="potager-scan-result screen-enter">
      <button
        type="button"
        className="potager-scan-back"
        onClick={onBack}
        aria-label={t("themes.potager.back_to_garden")}
      >
        ← {t("themes.potager.back_to_garden")}
      </button>

      {photo && (
        <div className="potager-scan-photo-wrap">
          <img src={photo} alt="" className="potager-scan-photo" />
        </div>
      )}

      <div className="potager-scan-content">
        <h1 className="potager-scan-name">{result.nom}</h1>

        <DiscoveryAnalysisSections data={result} t={t} />

        <p className={`potager-scan-health potager-scan-health--${healthClass}`}>
          {t(`themes.potager.health_status_${health}`)}
        </p>

        <p className="potager-scan-action">{action}</p>
      </div>

      <DiscoveryResultActions
        discovery={discovery}
        t={t}
        lang={lang}
        organizeHint={organizeHint}
        onOrganizeDestination={onOrganizeDestination}
        onScanAgain={onScanAgain}
      />

      <p className="sr-only" aria-live="polite">
        ✓ {t("themes.potager.saved_auto")}
      </p>
    </div>
  );
}
