import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";
import { getTypeLabel } from "@/lib/i18n";

const PLANT_TYPES = new Set(["plante", "arbre", "fleur", "herbe"]);

export default function RandoScanResult({ result, photo, t, onBack, onScanAgain, onEndRando }) {
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

  const description =
    result?.description?.trim() ||
    result?.habitat?.trim() ||
    result?.fun_fact?.trim() ||
    "";

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

        {description && <p className="rando-scan-desc">{description}</p>}

        {showHealth && health && (
          <p className={`rando-scan-health rando-scan-health--${healthClass}`}>
            {t(`themes.randos.health_status_${health}`)}
          </p>
        )}
      </div>

      <p className="rando-scan-saved" aria-live="polite">
        ✓ {t("themes.randos.saved_auto")}
      </p>

      <div className="rando-scan-actions">
        <button type="button" className="rando-scan-cta" onClick={onScanAgain}>
          <span aria-hidden="true">📸</span> {t("themes.randos.scan_again")}
        </button>
        {onEndRando && (
          <button type="button" className="rando-scan-end" onClick={onEndRando}>
            {t("themes.randos.end")}
          </button>
        )}
      </div>
    </div>
  );
}
