/** Bouton Scanner fixe — visible sur chaque onglet principal (sauf accueil, bouton héros). */
export default function FloatingScannerButton({ onClick, t, className = "" }) {
  return (
    <button
      type="button"
      className={`scanner-fab${className ? ` ${className}` : ""}`}
      onClick={onClick}
      aria-label={t("scanner.button")}
    >
      <span className="scanner-fab-emoji" aria-hidden="true">
        📸
      </span>
      <span className="scanner-fab-label">{t("scanner.button")}</span>
    </button>
  );
}
