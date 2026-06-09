import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";
import { getTypeLabel } from "@/lib/i18n";
import DiscoveryAnalysisSections from "@/components/DiscoveryAnalysisSections";
import DiscoveryResultActions from "@/components/DiscoveryResultActions";

const PLANT_TYPES = new Set(["plante", "arbre", "fleur", "herbe"]);

export default function RandoScanResult({
  result,
  photo,
  discovery,
  t,
  lang,
  onBack,
  onScanAgain,
  scanAgainLabel,
  onOrganizeDestination,
  organizeHint,
  onEndRando,
}) {
  const type = result?.type || "plante";
  const typeLabel = getTypeLabel(t, type);
  const showHealth = PLANT_TYPES.has(type);
  const health = showHealth ? inferHealthFromEtatSante(result?.etat_sante) : null;

  const healthClass =
    health === HEALTH.critical
      ? "critical"
      : health === HEALTH.warning
        ? "warning"
        : "good";

  return (
    <div className="rando-scan-result screen-enter">
      <button
        type="button"
        className="rando-scan-back"
        onClick={onBack}
        aria-label={t("themes.randos.back_to_rando")}
      >
        ← {t("themes.randos.back_to_rando")}
      </button>

      {photo && (
        <div className="rando-scan-photo-wrap">
          <img src={photo} alt="" className="rando-scan-photo" />
        </div>
      )}

      <div className="rando-scan-content">
        <span className="rando-scan-type">{typeLabel}</span>
        <h1 className="rando-scan-name">{result.nom}</h1>
        {result.nom_latin && <p className="rando-scan-latin">{result.nom_latin}</p>}

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

        {showHealth && health && (
          <p className={`rando-scan-health rando-scan-health--${healthClass}`}>
            {t(`themes.randos.health_status_${health}`)}
          </p>
        )}
      </div>

      <p className="rando-scan-saved" aria-live="polite">
        ✓ {t("themes.randos.saved_auto")}
      </p>

      <DiscoveryResultActions
        discovery={discovery}
        t={t}
        lang={lang}
        organizeHint={organizeHint}
        onOrganizeDestination={onOrganizeDestination}
        onScanAgain={onScanAgain}
        scanAgainLabel={scanAgainLabel}
      />

      {onEndRando && (
        <button type="button" className="rando-scan-end" onClick={onEndRando}>
          {t("themes.randos.end")}
        </button>
      )}
    </div>
  );
}
