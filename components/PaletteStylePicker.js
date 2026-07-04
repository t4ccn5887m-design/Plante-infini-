import { useState } from "react";
import { createPortal } from "react-dom";
import { PALETTE_STYLES } from "@/lib/paletteStyles";

function expositionLabel(t, value) {
  if (!value) return "";
  const key = `palette.zone.exposition_${value.replace("-", "_")}`;
  return t(key);
}

export default function PaletteStylePicker({ open, t, onClose, onApply }) {
  const [selectedId, setSelectedId] = useState(null);
  const [applying, setApplying] = useState(false);

  if (!open || typeof document === "undefined") return null;

  const selectedStyle = PALETTE_STYLES.find((s) => s.id === selectedId);

  const handleApply = async () => {
    if (!selectedId || applying) return;
    setApplying(true);
    await onApply(selectedId);
    setApplying(false);
    setSelectedId(null);
  };

  const handleClose = () => {
    if (applying) return;
    setSelectedId(null);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <div className="modal-sheet palette-style-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{t("palette.style.picker_title")}</h2>
        <p className="palette-picker-subtitle">{t("palette.style.picker_subtitle")}</p>

        <div className="palette-style-grid">
          {PALETTE_STYLES.map((style) => {
            const isSelected = selectedId === style.id;
            return (
              <button
                key={style.id}
                type="button"
                className={`palette-style-card${isSelected ? " palette-style-card--selected" : ""}`}
                onClick={() => setSelectedId(style.id)}
                aria-pressed={isSelected}
              >
                <span className="palette-style-card-emoji" aria-hidden="true">
                  {style.emoji}
                </span>
                <strong className="palette-style-card-title">
                  {t(`palette.style.${style.id}.title`)}
                </strong>
                <p className="palette-style-card-desc">{t(`palette.style.${style.id}.description`)}</p>
                <ul className="palette-style-card-zones">
                  {style.zones.map((zone) => (
                    <li key={zone.key}>
                      {t(`palette.style.${style.id}.zones.${zone.key}`)}
                      <span className="palette-style-card-expo">
                        {expositionLabel(t, zone.exposition)}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {selectedStyle && (
          <p className="palette-style-confirm-hint">
            {t("palette.style.confirm_hint", { n: selectedStyle.zones.length })}
          </p>
        )}

        <div className="modal-actions palette-picker-actions">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={applying}>
            {t("albums.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedId || applying}
            onClick={handleApply}
          >
            {t("palette.style.apply")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
