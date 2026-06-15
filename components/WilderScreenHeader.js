import { ThemeIcon } from "@/components/ThemeIcons";

export default function WilderScreenHeader({
  title,
  subtitle,
  themeId,
  onBack,
  backLabel,
  actions,
}) {
  return (
    <header className="wilder-screen-header">
      <div className="wilder-screen-header-band" aria-hidden="true" />
      <div className="wilder-screen-header-inner">
        {onBack && (
          <button type="button" className="wilder-screen-header-back" onClick={onBack}>
            ← {backLabel}
          </button>
        )}
        <div className="wilder-screen-header-main">
          <div className="wilder-screen-header-icon">
            {themeId ? (
              <ThemeIcon themeId={themeId} size={28} color="currentColor" />
            ) : (
              <img src="/logowilder.png" alt="" width={32} height={32} className="wilder-screen-header-logo" />
            )}
          </div>
          <div className="wilder-screen-header-text">
            <h1 className="wilder-screen-header-title">{title}</h1>
            {subtitle && <p className="wilder-screen-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="wilder-screen-header-actions">{actions}</div>}
      </div>
    </header>
  );
}
