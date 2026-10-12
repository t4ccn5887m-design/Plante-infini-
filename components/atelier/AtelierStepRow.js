/** Ligne d'étape dossier : 01 · titre · statut (sage / clay). */
export default function AtelierStepRow({ index, title, statusLabel, done = false, onClick, as = "button" }) {
  const num = String(index).padStart(2, "0");
  const Tag = as;
  const props =
    as === "button"
      ? { type: "button", onClick, className: "atelier-step-row atelier-step-row--btn" }
      : { className: "atelier-step-row" };

  return (
    <Tag {...props}>
      <em className="atelier-step-row__num">{num}</em>
      <span className="atelier-step-row__title">{title}</span>
      <i className={`atelier-step-row__status ${done ? "is-done" : "is-todo"}`}>{statusLabel}</i>
    </Tag>
  );
}
