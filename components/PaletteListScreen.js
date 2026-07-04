import { useCallback, useEffect, useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import WilderEmptyState from "@/components/WilderEmptyState";
import {
  createPalette,
  deletePalette,
  fetchPalettes,
  renamePalette,
} from "@/lib/paletteStorage";

function formatPaletteDate(iso, locale, t) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted;
}

function PaletteRow({
  palette,
  locale,
  t,
  isEditing,
  editValue,
  onEditValueChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onRequestDelete,
  onOpen,
}) {
  const created = palette.created_at;
  const updated = palette.updated_at;
  const showUpdated = updated && created && updated !== created;
  const dateLabel = showUpdated
    ? t("palette.updated_on", {
        date: formatPaletteDate(updated, locale, t),
      })
    : t("palette.created_on", {
        date: formatPaletteDate(created || updated, locale, t),
      });

  return (
    <li className="palette-list-item">
      <button
        type="button"
        className="palette-list-item-open"
        onClick={() => !isEditing && onOpen?.(palette)}
        disabled={isEditing}
        aria-label={palette.nom}
      >
        <div className="palette-list-item-main">
        {isEditing ? (
          <input
            type="text"
            className="palette-list-rename-input"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveRename();
              if (e.key === "Escape") onCancelRename();
            }}
            onBlur={onSaveRename}
            autoFocus
            aria-label={t("palette.rename")}
          />
        ) : (
          <p className="palette-list-item-name">{palette.nom}</p>
        )}
        <p className="palette-list-item-date">{dateLabel}</p>
      </div>
      </button>
      {!isEditing && (
        <div className="palette-list-item-actions">
          <button
            type="button"
            className="palette-list-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            aria-label={t("palette.rename")}
          >
            ✏️
          </button>
          <button
            type="button"
            className="palette-list-icon-btn palette-list-icon-btn--danger"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete();
            }}
            aria-label={t("palette.delete")}
          >
            🗑️
          </button>
        </div>
      )}
    </li>
  );
}

export default function PaletteListScreen({
  t,
  locale = "fr-FR",
  onBack,
  backLabel,
  onOpenPalette,
}) {
  const [palettes, setPalettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const loadPalettes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchPalettes();
    if (!result.ok) {
      setError(result.error || "unknown");
      setPalettes([]);
    } else {
      setPalettes(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPalettes();
  }, [loadPalettes]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    const result = await createPalette(t("palette.default_name"));
    setCreating(false);
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setPalettes((prev) => [result.data, ...prev]);
    setEditingId(result.data.id);
    setEditValue(result.data.nom);
  };

  const handleStartRename = (palette) => {
    setEditingId(palette.id);
    setEditValue(palette.nom);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveRename = async () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    const current = palettes.find((p) => p.id === editingId);
    if (!trimmed) {
      handleCancelRename();
      return;
    }
    if (current && current.nom === trimmed) {
      handleCancelRename();
      return;
    }

    const paletteId = editingId;
    handleCancelRename();

    const result = await renamePalette(paletteId, trimmed);
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setPalettes((prev) =>
      prev.map((p) => (p.id === paletteId ? { ...p, ...result.data } : p))
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    const result = await deletePalette(id);
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setPalettes((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="palette-list-screen biodex-screen screen-enter">
      <div className="albums-header palette-list-header">
        <button
          type="button"
          className="btn-secondary palette-list-back"
          onClick={onBack}
          aria-label={backLabel}
        >
          ←
        </button>
        <h1 className="albums-title">{t("palette.title")}</h1>
        <button
          type="button"
          className="btn-secondary palette-list-add"
          onClick={handleCreate}
          disabled={creating || loading}
          aria-label={t("palette.create")}
        >
          +
        </button>
      </div>

      <p className="palette-list-subtitle">{t("palette.subtitle")}</p>

      {loading && (
        <p className="palette-list-status">{t("palette.loading")}</p>
      )}

      {!loading && error && (
        <div className="palette-list-error">
          <p>{t("palette.error")}</p>
          <button type="button" className="btn-secondary" onClick={loadPalettes}>
            {t("palette.retry")}
          </button>
        </div>
      )}

      {!loading && !error && palettes.length === 0 && (
        <WilderEmptyState
          icon="🌿"
          message={t("palette.empty_message")}
          hint={t("palette.empty_hint")}
          ctaLabel={t("palette.empty_cta")}
          onCta={handleCreate}
        />
      )}

      {!loading && !error && palettes.length > 0 && (
        <ul className="palette-list">
          {palettes.map((palette) => (
            <PaletteRow
              key={palette.id}
              palette={palette}
              locale={locale}
              t={t}
              isEditing={editingId === palette.id}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onStartRename={() => handleStartRename(palette)}
              onSaveRename={handleSaveRename}
              onCancelRename={handleCancelRename}
              onRequestDelete={() => setDeleteId(palette.id)}
              onOpen={onOpenPalette}
            />
          ))}
        </ul>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteId)}
        message={t("palette.delete_confirm")}
        cancelLabel={t("albums.cancel")}
        confirmLabel={t("palette.delete")}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
