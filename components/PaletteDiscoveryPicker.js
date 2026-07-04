import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { fetchPlantAnalysesForPalette } from "@/lib/analysesStorage";
import {
  defaultQuantityForType,
  inferPaletteItemType,
  normalizePaletteItemPayload,
} from "@/lib/palettePlants";

function ConfigureRow({ entry, t, onChange }) {
  const { discovery, type, quantite, note } = entry;

  const setType = (nextType) => {
    onChange({
      ...entry,
      type: nextType,
      quantite: defaultQuantityForType(nextType),
    });
  };

  return (
    <li className="palette-picker-config-row">
      <div className="palette-picker-config-head">
        {discovery.photo ? (
          <img src={discovery.photo} alt="" className="palette-item-photo" />
        ) : (
          <div className="palette-item-photo palette-item-photo--placeholder">🌿</div>
        )}
        <div className="palette-picker-config-names">
          <strong>{discovery.nom}</strong>
          {discovery.nom_latin && <span className="palette-item-latin">{discovery.nom_latin}</span>}
        </div>
      </div>
      <div className="palette-picker-config-fields">
        <div className="palette-picker-type-toggle" role="group" aria-label={t("palette.item.type_label")}>
          <button
            type="button"
            className={`palette-type-chip${type === "sujet" ? " palette-type-chip--active" : ""}`}
            onClick={() => setType("sujet")}
          >
            {t("palette.item.type_sujet")}
          </button>
          <button
            type="button"
            className={`palette-type-chip${type === "massif" ? " palette-type-chip--active" : ""}`}
            onClick={() => setType("massif")}
          >
            {t("palette.item.type_massif")}
          </button>
        </div>
        {type === "sujet" && (
          <label className="palette-zone-field palette-picker-qty-field">
            <span className="palette-zone-field-label">{t("palette.item.quantity_label")}</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className="palette-zone-input"
              value={quantite ?? 1}
              onChange={(e) => onChange({ ...entry, quantite: e.target.value })}
            />
          </label>
        )}
        <label className="palette-zone-field palette-picker-note-field">
          <span className="palette-zone-field-label">{t("palette.item.note_label")}</span>
          <input
            type="text"
            className="palette-zone-input"
            value={note || ""}
            placeholder={t("palette.item.note_placeholder")}
            onChange={(e) => onChange({ ...entry, note: e.target.value })}
          />
        </label>
      </div>
    </li>
  );
}

export default function PaletteDiscoveryPicker({
  open,
  zoneId,
  excludedAnalysisIds = [],
  t,
  onClose,
  onConfirm,
}) {
  const [step, setStep] = useState("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [configureEntries, setConfigureEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const excluded = useMemo(() => new Set(excludedAnalysisIds), [excludedAnalysisIds]);

  useEffect(() => {
    if (!open) return undefined;

    setStep("pick");
    setSelectedIds(new Set());
    setConfigureEntries([]);
    setError(null);

    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchPlantAnalysesForPalette();
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error || "unknown");
        setCandidates([]);
        return;
      }
      setCandidates(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, zoneId]);

  const toggleSelection = (analysisId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(analysisId)) next.delete(analysisId);
      else next.add(analysisId);
      return next;
    });
  };

  const handleNext = () => {
    const picked = candidates.filter((c) => selectedIds.has(c.analysisId));
    setConfigureEntries(
      picked.map((c) => ({
        analysisId: c.analysisId,
        discovery: c.discovery,
        type: inferPaletteItemType(c.discovery),
        quantite: defaultQuantityForType(inferPaletteItemType(c.discovery)),
        note: "",
      }))
    );
    setStep("configure");
  };

  const handleConfirm = async () => {
    if (submitting) return;

    const payload = [];
    for (const entry of configureEntries) {
      const normalized = normalizePaletteItemPayload({
        type: entry.type,
        quantite: entry.quantite,
        note: entry.note,
      });
      if (!normalized.ok) {
        setError(normalized.error);
        return;
      }
      payload.push({
        analysisId: entry.analysisId,
        ...normalized.data,
      });
    }

    setSubmitting(true);
    setError(null);
    await onConfirm(payload);
    setSubmitting(false);
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-sheet palette-picker-sheet" onClick={(e) => e.stopPropagation()}>
        {step === "pick" ? (
          <>
            <h2>{t("palette.item.picker_title")}</h2>
            <p className="palette-picker-subtitle">{t("palette.item.picker_subtitle")}</p>

            {loading && <p className="palette-list-status">{t("palette.item.picker_loading")}</p>}
            {!loading && error && <p className="palette-list-error">{t("palette.item.picker_error")}</p>}

            {!loading && !error && candidates.length === 0 && (
              <p className="palette-picker-empty">{t("palette.item.picker_empty")}</p>
            )}

            {!loading && !error && candidates.length > 0 && (
              <ul className="palette-picker-list">
                {candidates.map(({ analysisId, discovery }) => {
                  const disabled = excluded.has(analysisId);
                  const checked = selectedIds.has(analysisId);
                  return (
                    <li key={analysisId}>
                      <label
                        className={`palette-picker-option${disabled ? " palette-picker-option--disabled" : ""}${
                          checked ? " palette-picker-option--selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => !disabled && toggleSelection(analysisId)}
                        />
                        {discovery.photo ? (
                          <img src={discovery.photo} alt="" className="palette-item-photo" />
                        ) : (
                          <div className="palette-item-photo palette-item-photo--placeholder">🌿</div>
                        )}
                        <div className="palette-picker-option-text">
                          <strong>{discovery.nom}</strong>
                          {discovery.nom_latin && (
                            <span className="palette-item-latin">{discovery.nom_latin}</span>
                          )}
                          {disabled && (
                            <span className="palette-picker-in-zone">{t("palette.item.already_in_zone")}</span>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="modal-actions palette-picker-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t("albums.cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={loading || selectedIds.size === 0}
                onClick={handleNext}
              >
                {t("palette.item.picker_next", { n: selectedIds.size })}
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="theme-picker-back" onClick={() => setStep("pick")}>
              ← {t("palette.item.picker_back")}
            </button>
            <h2>{t("palette.item.configure_title")}</h2>
            <p className="palette-picker-subtitle">{t("palette.item.configure_subtitle")}</p>

            {error === "invalid_quantity" && (
              <p className="palette-list-error">{t("palette.item.invalid_quantity")}</p>
            )}

            <ul className="palette-picker-config-list">
              {configureEntries.map((entry) => (
                <ConfigureRow
                  key={entry.analysisId}
                  entry={entry}
                  t={t}
                  onChange={(next) =>
                    setConfigureEntries((prev) =>
                      prev.map((row) => (row.analysisId === next.analysisId ? next : row))
                    )
                  }
                />
              ))}
            </ul>

            <div className="modal-actions palette-picker-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                {t("albums.cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={submitting || configureEntries.length === 0}
                onClick={handleConfirm}
              >
                {t("palette.item.picker_confirm")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
