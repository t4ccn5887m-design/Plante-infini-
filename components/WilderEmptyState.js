export default function WilderEmptyState({ icon, message, hint, ctaLabel, onCta, className = "" }) {
  return (
    <div className={`wilder-empty-state${className ? ` ${className}` : ""}`}>
      {icon && (
        <div className="wilder-empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="wilder-empty-state-message">{message}</p>
      {hint && <p className="wilder-empty-state-hint">{hint}</p>}
      {ctaLabel && onCta && (
        <button type="button" className="btn-primary wilder-empty-state-cta" onClick={onCta}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
