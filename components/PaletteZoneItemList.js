import { useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { defaultQuantityForType } from "@/lib/palettePlants";

function PaletteItemRow({ item, t, onUpdate, onRemove }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const discovery = item.discovery || {};
  const isSujet = item.type === "sujet";

  const handleTypeChange = (nextType) => {
    onUpdate(
      item.id,
      {
        type: nextType,
        quantite: defaultQuantityForType(nextType),
      },
      { persist: true }
    );
  };

  return (
    <li className="palette-item-card">
      <div className="palette-item-main">
        {discovery.photo ? (
          <img src={discovery.photo} alt="" className="palette-item-photo" />
        ) : (
          <div className="palette-item-photo palette-item-photo--placeholder">🌿</div>
        )}
        <div className="palette-item-text">
          <div className="palette-item-title-row">
            <strong className="palette-item-name">{discovery.nom || "—"}</strong>
            <span className={`palette-item-type-badge palette-item-type-badge--${item.type}`}>
              {isSujet ? t("palette.item.type_sujet") : t("palette.item.type_massif")}
            </span>
          </div>
          {discovery.nom_latin && <p className="palette-item-latin">{discovery.nom_latin}</p>}
          {isSujet && item.quantite != null && (
            <p className="palette-item-qty">{t("palette.item.quantity_value", { n: item.quantite })}</p>
          )}
        </div>
        <button
          type="button"
          className="palette-list-icon-btn palette-list-icon-btn--danger"
          onClick={() => setRemoveOpen(true)}
          aria-label={t("palette.item.remove")}
        >
          🗑️
        </button>
      </div>

      <div className="palette-item-controls">
        <div className="palette-picker-type-toggle" role="group" aria-label={t("palette.item.type_label")}>
          <button
            type="button"
            className={`palette-type-chip${isSujet ? " palette-type-chip--active" : ""}`}
            onClick={() => handleTypeChange("sujet")}
          >
            {t("palette.item.type_sujet")}
          </button>
          <button
            type="button"
            className={`palette-type-chip${!isSujet ? " palette-type-chip--active" : ""}`}
            onClick={() => handleTypeChange("massif")}
          >
            {t("palette.item.type_massif")}
          </button>
        </div>
        {isSujet && (
          <label className="palette-zone-field palette-item-qty-field">
            <span className="palette-zone-field-label">{t("palette.item.quantity_label")}</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className="palette-zone-input"
              value={item.quantite ?? 1}
              onChange={(e) => onUpdate(item.id, { quantite: e.target.value })}
              onBlur={(e) => onUpdate(item.id, { quantite: e.target.value }, { persist: true })}
            />
          </label>
        )}
        <label className="palette-zone-field palette-item-note-field">
          <span className="palette-zone-field-label">{t("palette.item.note_label")}</span>
          <input
            type="text"
            className="palette-zone-input"
            value={item.note || ""}
            placeholder={t("palette.item.note_placeholder")}
            onChange={(e) => onUpdate(item.id, { note: e.target.value })}
            onBlur={(e) => onUpdate(item.id, { note: e.target.value }, { persist: true })}
          />
        </label>
      </div>

      <DeleteConfirmDialog
        open={removeOpen}
        message={t("palette.item.remove_confirm")}
        cancelLabel={t("albums.cancel")}
        confirmLabel={t("palette.item.remove")}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={() => {
          setRemoveOpen(false);
          onRemove(item.id);
        }}
      />
    </li>
  );
}

export default function PaletteZoneItemList({ items, t, onUpdate, onRemove }) {
  if (!items?.length) {
    return <p className="palette-zone-items-empty">{t("palette.item.empty")}</p>;
  }

  return (
    <ul className="palette-zone-items">
      {items.map((item) => (
        <PaletteItemRow key={item.id} item={item} t={t} onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </ul>
  );
}
