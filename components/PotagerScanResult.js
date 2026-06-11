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
  onDelete,
  deleteLabels,
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

        <DiscoveryAnalysisSections
          data={{
            ...result,
            tronc_diametre_cm: discovery?.tronc_diametre_cm ?? result.tronc_diametre_cm,
            age_precis_tronc: discovery?.age_precis_tronc ?? result.age_precis_tronc,
            age_precis_coefficient:
              discovery?.age_precis_coefficient ?? result.age_precis_coefficient,
            age_precis_note: discovery?.age_precis_note ?? result.age_precis_note,
          }}
          t={t}
          lang={lang}
          discoveryId={discovery?.id}
        />

        <p className={`potager-scan-health potager-scan-health--${healthClass}`}>
          {t(`themes.potager.health_status_${health}`)}
        </p>

        <p className="potager-scan-action">{action}</p>
      </div>

      <DiscoveryResultActions
        discovery={discovery}
        t={t}
        lang={lang}
        onScanAgain={onScanAgain}
        onDelete={onDelete}
        deleteLabels={deleteLabels}
      />

      <p className="sr-only" aria-live="polite">
        ✓ {t("themes.potager.saved_auto")}
      </p>
    </div>
  );
}
