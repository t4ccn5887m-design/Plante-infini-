/**
 * Groupe de puces réutilisable (brief pro + dossier particulier).
 */
export default function BriefChipGroup({
  label,
  hint,
  options,
  mode = "multi",
  value,
  onChange,
  className = "",
}) {
  const selectedSet =
    mode === "single"
      ? new Set(value ? [value] : [])
      : new Set(Array.isArray(value) ? value : []);

  const toggle = (option) => {
    if (mode === "single") {
      onChange(selectedSet.has(option) ? null : option);
      return;
    }
    const next = new Set(selectedSet);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(Array.from(next));
  };

  return (
    <div className={className}>
      {label ? <div className="bf-section-label">{label}</div> : null}
      {hint ? <p className="bf-hint calm">{hint}</p> : null}
      <div className="bf-chips">
        {options.map((option) => {
          const on = selectedSet.has(option);
          return (
            <button
              key={option}
              type="button"
              className={`bf-chip ${on ? "on" : ""}`}
              onClick={() => toggle(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
