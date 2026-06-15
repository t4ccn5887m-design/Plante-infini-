import { IconChevronRight } from "@/components/ThemeIcons";

export function ThemeHubNavCard({
  emoji,
  icon,
  title,
  hint,
  onClick,
  variant = "default",
  delay = 0,
}) {
  return (
    <button
      type="button"
      className={`theme-hub-card theme-hub-card--${variant}`}
      onClick={onClick}
      style={{ "--stagger": delay }}
    >
      <div className="theme-hub-card-glow" aria-hidden="true" />
      <span
        className={`theme-hub-card-emoji${icon ? " theme-hub-card-emoji--icon" : ""}`}
        aria-hidden="true"
      >
        {icon ?? emoji}
      </span>
      <div className="theme-hub-card-text">
        <span className="theme-hub-card-title">{title}</span>
        {hint && <span className="theme-hub-card-hint">{hint}</span>}
      </div>
      <span className="theme-hub-card-arrow">
        <IconChevronRight size={22} color="currentColor" />
      </span>
    </button>
  );
}

export function ThemeHubHeader({ title, subtitle }) {
  return (
    <header className="theme-hub-header">
      <h1 className="theme-hub-title">{title}</h1>
      {subtitle && <p className="theme-hub-subtitle">{subtitle}</p>}
    </header>
  );
}

export function ThemeHubBack({ label, onClick }) {
  return (
    <button type="button" className="theme-hub-back" onClick={onClick}>
      ← {label}
    </button>
  );
}
