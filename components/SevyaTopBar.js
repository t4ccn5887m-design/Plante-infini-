import Link from "next/link";

/**
 * Barre haute maquette : Sevya (Fraunces 500) ou titre centré, avatar initiales à droite.
 */
export default function SevyaTopBar({
  title = "Sevya",
  titlePro = false,
  backHref = null,
  onBack,
  initials = null,
  rightSlot = null,
  className = "",
  overlay = false,
}) {
  const backEl =
    backHref != null ? (
      <Link href={backHref} className="sevya-topbar__back" aria-label="Retour">
        ‹
      </Link>
    ) : onBack ? (
      <button type="button" className="sevya-topbar__back" onClick={onBack} aria-label="Retour">
        ‹
      </button>
    ) : (
      <span className="sevya-topbar__spacer" aria-hidden="true" />
    );

  return (
    <header
      className={`sevya-topbar${overlay ? " sevya-topbar--overlay" : ""} ${className}`.trim()}
    >
      {backEl}
      <div className="sevya-topbar__title-wrap">
        {titlePro ? (
          <b className="sevya-topbar__brand">
            Sevya <span className="sevya-topbar__pro">PRO</span>
          </b>
        ) : (
          <b className="sevya-topbar__brand">{title}</b>
        )}
      </div>
      {rightSlot ? (
        <div className="sevya-topbar__right">{rightSlot}</div>
      ) : initials ? (
        <span className="sevya-topbar__avatar" aria-hidden="true">
          {initials}
        </span>
      ) : (
        <span className="sevya-topbar__spacer" aria-hidden="true" />
      )}
    </header>
  );
}
