import { useCallback, useEffect, useMemo, useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import PaletteDiscoveryPicker from "@/components/PaletteDiscoveryPicker";
import PaletteExportModal from "@/components/PaletteExportModal";
import PaletteStylePicker from "@/components/PaletteStylePicker";
import PaletteZoneItemList from "@/components/PaletteZoneItemList";
import WilderEmptyState from "@/components/WilderEmptyState";
import { resolveStyleZones } from "@/lib/paletteStyles";
import {
  addZoneItems,
  applyPaletteStyle,
  buildDefaultMassifName,
  createZone,
  deleteZone,
  ensureSujetsIsolesZone,
  fetchPalette,
  fetchPaletteItems,
  fetchZones,
  removePaletteItem,
  updatePaletteItem,
  updateZone,
} from "@/lib/paletteStorage";

const EXPOSITION_VALUES = ["soleil", "mi-ombre", "ombre"];

function expositionLabel(t, value) {
  if (!value) return t("palette.zone.exposition_none");
  const key = `palette.zone.exposition_${value.replace("-", "_")}`;
  return t(key);
}

function ZoneMeta({ zone, t }) {
  const parts = [];
  if (!zone.is_sujets_isoles && zone.surface_m2 != null && zone.surface_m2 !== "") {
    parts.push(t("palette.zone.surface_value", { n: zone.surface_m2 }));
  }
  if (zone.exposition) {
    parts.push(expositionLabel(t, zone.exposition));
  }
  if (zone.is_sujets_isoles && parts.length === 0 && zone.exposition == null) {
    return <p className="palette-zone-meta palette-zone-meta--hint">{t("palette.zone.sujets_isoles_hint")}</p>;
  }
  if (parts.length === 0) return null;
  return <p className="palette-zone-meta">{parts.join(" · ")}</p>;
}

function ZoneRow({
  zone,
  t,
  items,
  isEditing,
  editValue,
  onEditValueChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onRequestDelete,
  onSurfaceChange,
  onExpositionChange,
  onAddPlant,
  onUpdateItem,
  onRemoveItem,
}) {
  const surfaceValue =
    zone.surface_m2 == null || zone.surface_m2 === "" ? "" : String(zone.surface_m2);

  return (
    <li
      className={`palette-zone-item${zone.is_sujets_isoles ? " palette-zone-item--sujets" : ""}`}
    >
      <div className="palette-zone-item-head">
        <div className="palette-zone-item-title-wrap">
          {zone.is_sujets_isoles && (
            <span className="palette-zone-badge" aria-hidden="true">
              🌿
            </span>
          )}
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
              aria-label={t("palette.zone.rename")}
            />
          ) : (
            <p className="palette-zone-name">{zone.nom}</p>
          )}
        </div>
        {!isEditing && (
          <div className="palette-list-item-actions">
            <button
              type="button"
              className="palette-list-icon-btn"
              onClick={onStartRename}
              aria-label={t("palette.zone.rename")}
            >
              ✏️
            </button>
            {!zone.is_sujets_isoles && (
              <button
                type="button"
                className="palette-list-icon-btn palette-list-icon-btn--danger"
                onClick={onRequestDelete}
                aria-label={t("palette.zone.delete")}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {!isEditing && <ZoneMeta zone={zone} t={t} />}

      {!isEditing && (
        <div className="palette-zone-fields">
          {!zone.is_sujets_isoles && (
            <label className="palette-zone-field">
              <span className="palette-zone-field-label">{t("palette.zone.surface_label")}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                className="palette-zone-input"
                value={surfaceValue}
                placeholder="—"
                onChange={(e) => onSurfaceChange(zone.id, e.target.value)}
                aria-label={t("palette.zone.surface_label")}
              />
            </label>
          )}
          <label className="palette-zone-field">
            <span className="palette-zone-field-label">{t("palette.zone.exposition_label")}</span>
            <select
              className="palette-zone-select"
              value={zone.exposition || ""}
              onChange={(e) => onExpositionChange(zone.id, e.target.value)}
              aria-label={t("palette.zone.exposition_label")}
            >
              <option value="">{t("palette.zone.exposition_none")}</option>
              {EXPOSITION_VALUES.map((value) => (
                <option key={value} value={value}>
                  {expositionLabel(t, value)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!isEditing && (
        <div className="palette-zone-plants">
          <div className="palette-zone-plants-head">
            <h3 className="palette-zone-plants-title">{t("palette.item.section_title")}</h3>
            <button type="button" className="btn-secondary palette-zone-add-plant" onClick={onAddPlant}>
              {t("palette.item.add")}
            </button>
          </div>
          <PaletteZoneItemList items={items} t={t} onUpdate={onUpdateItem} onRemove={onRemoveItem} />
        </div>
      )}
    </li>
  );
}

export default function PaletteDetailScreen({
  t,
  paletteId,
  onBack,
  backLabel,
}) {
  const [palette, setPalette] = useState(null);
  const [zones, setZones] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [pickerZoneId, setPickerZoneId] = useState(null);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [applyingStyle, setApplyingStyle] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleExportClick = () => {
    // TODO: paywall 2€ export — vérifier achat/abonnement avant generatePalettePdf
    setExportModalOpen(true);
  };

  const massifs = useMemo(
    () => zones.filter((z) => !z.is_sujets_isoles),
    [zones]
  );

  const itemsByZone = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const list = map.get(item.zone_id) || [];
      list.push(item);
      map.set(item.zone_id, list);
    }
    return map;
  }, [items]);

  const pickerExcludedIds = useMemo(() => {
    if (!pickerZoneId) return [];
    return (itemsByZone.get(pickerZoneId) || []).map((item) => item.analysis_id);
  }, [pickerZoneId, itemsByZone]);

  const loadData = useCallback(async () => {
    if (!paletteId) return;
    setLoading(true);
    setError(null);

    const paletteResult = await fetchPalette(paletteId);
    if (!paletteResult.ok) {
      setError(paletteResult.error || "unknown");
      setPalette(null);
      setZones([]);
      setItems([]);
      setLoading(false);
      return;
    }
    setPalette(paletteResult.data);

    await ensureSujetsIsolesZone(paletteId, t("palette.zone.sujets_isoles_name"));

    const [zonesResult, itemsResult] = await Promise.all([
      fetchZones(paletteId),
      fetchPaletteItems(paletteId),
    ]);

    if (!zonesResult.ok) {
      setError(zonesResult.error || "unknown");
      setZones([]);
    } else {
      setZones(zonesResult.data);
    }

    if (!itemsResult.ok) {
      setError(itemsResult.error || "unknown");
      setItems([]);
    } else {
      setItems(itemsResult.data);
    }
    setLoading(false);
  }, [paletteId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateZone = async () => {
    if (creating) return;
    setCreating(true);
    const nom = buildDefaultMassifName(zones, (n) =>
      t("palette.zone.default_massif", { n })
    );
    const result = await createZone(paletteId, nom);
    setCreating(false);
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setZones((prev) => {
      const withoutNew = prev.filter((z) => z.id !== result.data.id);
      const massifZones = withoutNew.filter((z) => !z.is_sujets_isoles);
      const sujets = withoutNew.filter((z) => z.is_sujets_isoles);
      return [...massifZones, result.data, ...sujets];
    });
    setEditingId(result.data.id);
    setEditValue(result.data.nom);
  };

  const handleStartRename = (zone) => {
    setEditingId(zone.id);
    setEditValue(zone.nom);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveRename = async () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    const current = zones.find((z) => z.id === editingId);
    if (!trimmed) {
      handleCancelRename();
      return;
    }
    if (current && current.nom === trimmed) {
      handleCancelRename();
      return;
    }

    const zoneId = editingId;
    handleCancelRename();

    const result = await updateZone(zoneId, { nom: trimmed });
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, ...result.data } : z)));
  };

  const patchZone = (zoneId, patch) => {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)));
  };

  const handleSurfaceChange = async (zoneId, rawValue) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone || zone.is_sujets_isoles) return;

    if (rawValue === "") {
      patchZone(zoneId, { surface_m2: null });
      const result = await updateZone(zoneId, { surface_m2: null });
      if (!result.ok) setError(result.error || "unknown");
      else patchZone(zoneId, result.data);
      return;
    }

    patchZone(zoneId, { surface_m2: rawValue });
    const result = await updateZone(zoneId, { surface_m2: rawValue });
    if (!result.ok) {
      setError(result.error || "unknown");
      await loadData();
      return;
    }
    patchZone(zoneId, result.data);
  };

  const handleExpositionChange = async (zoneId, value) => {
    const exposition = value || null;
    patchZone(zoneId, { exposition });
    const result = await updateZone(zoneId, { exposition });
    if (!result.ok) {
      setError(result.error || "unknown");
      await loadData();
      return;
    }
    patchZone(zoneId, result.data);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    const result = await deleteZone(id);
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setZones((prev) => prev.filter((z) => z.id !== id));
    setItems((prev) => prev.filter((item) => item.zone_id !== id));
  };

  const patchItem = (itemId, patch) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  };

  const handleUpdateItem = async (itemId, patch, options = {}) => {
    const current = items.find((item) => item.id === itemId);
    if (!current) return;

    patchItem(itemId, patch);

    const shouldPersist = options.persist || patch.type !== undefined;
    if (!shouldPersist) return;

    const result = await updatePaletteItem(itemId, {
      type: patch.type !== undefined ? patch.type : current.type,
      quantite: patch.quantite !== undefined ? patch.quantite : current.quantite,
      note: patch.note !== undefined ? patch.note : current.note,
    });

    if (!result.ok) {
      setError(result.error || "unknown");
      await loadData();
      return;
    }
    patchItem(itemId, result.data);
  };

  const handleRemoveItem = async (itemId) => {
    const result = await removePaletteItem(itemId);
    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleConfirmAddItems = async (payload) => {
    if (!pickerZoneId) return { ok: false, error: "invalid_input" };
    const result = await addZoneItems(pickerZoneId, payload);
    if (!result.ok) {
      setError(result.error || "unknown");
      return { ok: false, error: result.error || "unknown" };
    }
    if (result.data?.length) {
      setItems((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const row of result.data) {
          if (!existing.has(row.id)) merged.push(row);
        }
        return merged;
      });
    }
    setPickerZoneId(null);
    return { ok: true };
  };

  const handleApplyStyle = async (styleId) => {
    if (applyingStyle) return;
    setApplyingStyle(true);

    const ensureResult = await ensureSujetsIsolesZone(
      paletteId,
      t("palette.zone.sujets_isoles_name")
    );

    const zoneDefs = resolveStyleZones(styleId, t);
    const result = await applyPaletteStyle(paletteId, styleId, zoneDefs);

    setApplyingStyle(false);

    if (!result.ok) {
      setError(result.error || "unknown");
      return;
    }

    if (result.data?.length) {
      setZones((prev) => {
        const massifs = prev.filter((z) => !z.is_sujets_isoles);
        let sujets = prev.filter((z) => z.is_sujets_isoles);
        if (sujets.length === 0 && ensureResult.ok && ensureResult.data) {
          sujets = [ensureResult.data];
        }
        return [...massifs, ...result.data, ...sujets];
      });
    }

    if (result.styleSaved) {
      setPalette((prev) => (prev ? { ...prev, style: styleId } : prev));
    }

    setStylePickerOpen(false);
  };

  const styleButtonClass =
    massifs.length === 0
      ? "btn-secondary palette-style-bar-btn palette-style-bar-btn--prominent"
      : "btn-secondary palette-style-bar-btn";

  return (
    <div className="palette-list-screen palette-detail-screen biodex-screen screen-enter">
      <div className="albums-header palette-list-header">
        <button
          type="button"
          className="btn-secondary palette-list-back"
          onClick={onBack}
          aria-label={backLabel}
        >
          ←
        </button>
        <h1 className="albums-title">{palette?.nom || t("palette.zone.title")}</h1>
        <button
          type="button"
          className="btn-secondary palette-list-add"
          onClick={handleCreateZone}
          disabled={creating || loading}
          aria-label={t("palette.zone.add")}
        >
          +
        </button>
      </div>

      <p className="palette-list-subtitle">{t("palette.zone.subtitle")}</p>

      {!loading && (
        <div className="palette-style-bar palette-action-bar">
          <button
            type="button"
            className={styleButtonClass}
            onClick={() => setStylePickerOpen(true)}
            disabled={loading || applyingStyle}
          >
            {t("palette.style.button")}
          </button>
          <button
            type="button"
            className="btn-secondary palette-style-bar-btn"
            onClick={handleExportClick}
            disabled={loading}
          >
            {t("palette.export.button")}
          </button>
        </div>
      )}

      {loading && <p className="palette-list-status">{t("palette.zone.loading")}</p>}

      {!loading && error && (
        <div className="palette-list-error">
          <p>{t("palette.zone.error")}</p>
          <button type="button" className="btn-secondary" onClick={loadData}>
            {t("palette.zone.retry")}
          </button>
        </div>
      )}

      {!loading && !error && massifs.length === 0 && (
        <>
          <WilderEmptyState
            icon="🌿"
            message={t("palette.zone.empty_message")}
            hint={t("palette.zone.empty_hint")}
            ctaLabel={t("palette.zone.add")}
            onCta={handleCreateZone}
          />
          <div className="palette-style-empty-cta">
            <span className="palette-style-empty-or">{t("palette.style.or")}</span>
            <button
              type="button"
              className="btn-primary palette-style-empty-btn"
              onClick={() => setStylePickerOpen(true)}
              disabled={applyingStyle}
            >
              {t("palette.style.button")}
            </button>
          </div>
        </>
      )}

      {!loading && !error && zones.length > 0 && (
        <ul className="palette-zone-list">
          {zones.map((zone) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              t={t}
              items={itemsByZone.get(zone.id) || []}
              isEditing={editingId === zone.id}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onStartRename={() => handleStartRename(zone)}
              onSaveRename={handleSaveRename}
              onCancelRename={handleCancelRename}
              onRequestDelete={() => setDeleteId(zone.id)}
              onSurfaceChange={handleSurfaceChange}
              onExpositionChange={handleExpositionChange}
              onAddPlant={() => setPickerZoneId(zone.id)}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          ))}
        </ul>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteId)}
        message={t("palette.zone.delete_confirm")}
        cancelLabel={t("albums.cancel")}
        confirmLabel={t("palette.zone.delete")}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />

      <PaletteDiscoveryPicker
        open={Boolean(pickerZoneId)}
        zoneId={pickerZoneId}
        excludedAnalysisIds={pickerExcludedIds}
        t={t}
        onClose={() => setPickerZoneId(null)}
        onConfirm={handleConfirmAddItems}
      />

      <PaletteStylePicker
        open={stylePickerOpen}
        t={t}
        onClose={() => setStylePickerOpen(false)}
        onApply={handleApplyStyle}
      />

      <PaletteExportModal
        open={exportModalOpen}
        t={t}
        palette={palette}
        zones={zones}
        items={items}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
