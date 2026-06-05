import { IconChevronRight } from "@/components/ThemeIcons";

export function ThemeInterior({ themeId, children, className = "" }) {
  return (
    <div className={`theme-interior theme-interior--${themeId} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function ThemeHeroCard({
  title,
  subtitle,
  label,
  icon: Icon,
  onClick,
  variant = "primary",
  className = "",
  delay = 0,
}) {
  return (
    <button
      type="button"
      className={`theme-hero-card theme-hero-card--${variant} ${className}`.trim()}
      onClick={onClick}
      style={{ "--stagger": delay }}
    >
      <div className="theme-hero-card-glow" aria-hidden="true" />
      <div className="theme-hero-card-content">
        <div className="theme-hero-card-icon-wrap">
          {Icon && <Icon size={28} color="currentColor" />}
        </div>
        <div className="theme-hero-card-text">
          {title && <span className="theme-hero-card-eyebrow">{title}</span>}
          {subtitle && <span className="theme-hero-card-sub">{subtitle}</span>}
        </div>
        <span className="theme-hero-card-arrow">
          <IconChevronRight size={22} color="currentColor" />
        </span>
      </div>
      {label && <span className="theme-hero-card-label">{label}</span>}
    </button>
  );
}

export function ThemeGrid({ children, className = "" }) {
  return <div className={`theme-grid ${className}`.trim()}>{children}</div>;
}

export function ThemeGridCard({
  label,
  hint,
  icon: Icon,
  onClick,
  variant = "default",
  className = "",
  delay = 0,
  disabled = false,
}) {
  const Tag = onClick && !disabled ? "button" : "div";

  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      className={`theme-grid-card theme-grid-card--${variant} ${disabled ? "theme-grid-card--disabled" : ""} ${className}`.trim()}
      onClick={disabled ? undefined : onClick}
      style={{ "--stagger": delay }}
      disabled={Tag === "button" ? disabled : undefined}
    >
      <div className="theme-grid-card-icon">
        {Icon && <Icon size={22} color="currentColor" />}
      </div>
      <div className="theme-grid-card-text">
        <span className="theme-grid-card-label">{label}</span>
        {hint && <span className="theme-grid-card-hint">{hint}</span>}
      </div>
    </Tag>
  );
}

export function ThemeSection({ title, children, className = "" }) {
  return (
    <section className={`theme-section ${className}`.trim()}>
      {title && <h2 className="theme-section-title">{title}</h2>}
      {children}
    </section>
  );
}
