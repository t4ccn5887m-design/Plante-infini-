const MODES = [
  { id: "animal", emoji: "📸", labelKey: "mode_animal_cta", hintKey: "mode_animal_hint", variant: "primary" },
  { id: "traces", emoji: "🔍", labelKey: "mode_traces_cta", hintKey: "mode_traces_hint", variant: "secondary" },
  { id: "sound", emoji: "🎵", labelKey: "mode_sound_cta", hintKey: "mode_sound_hint", variant: "secondary" },
];

export default function AnimauxView({ onStartScan, children, t }) {
  return (
    <div className="animaux-simple">
      <header className="animaux-discovery-header">
        <h2 className="animaux-discovery-title">{t("themes.juniors.discovery_title")}</h2>
        <p className="animaux-discovery-sub">{t("themes.juniors.discovery_sub")}</p>
      </header>

      <div className="animaux-discovery-modes">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`animaux-mode-cta animaux-mode-cta--${mode.variant}`}
            onClick={() => onStartScan?.(mode.id)}
          >
            <span className="animaux-mode-cta-emoji" aria-hidden="true">
              {mode.emoji}
            </span>
            <span className="animaux-mode-cta-text">
              <span className="animaux-mode-cta-label">{t(`themes.juniors.${mode.labelKey}`)}</span>
              <span className="animaux-mode-cta-hint">{t(`themes.juniors.${mode.hintKey}`)}</span>
            </span>
          </button>
        ))}
      </div>

      {children}
    </div>
  );
}
