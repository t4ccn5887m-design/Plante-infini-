export default function AnimauxView({ onStartScan, children, t }) {
  return (
    <div className="animaux-simple">
      <button type="button" className="animaux-scan-cta" onClick={() => onStartScan?.()}>
        <span className="animaux-scan-cta-emoji" aria-hidden="true">
          📸
        </span>
        <span className="animaux-scan-cta-label">{t("themes.juniors.scan_cta")}</span>
      </button>

      {children}
    </div>
  );
}
