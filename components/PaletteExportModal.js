import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getDefaultExportContact,
  savePaletteExportContact,
} from "@/lib/paletteExportContact";
import { downloadPalettePdf } from "@/lib/palettePdf";

export default function PaletteExportModal({
  open,
  t,
  palette,
  zones,
  items,
  onClose,
}) {
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
  });
  const [loadingContact, setLoadingContact] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setError(null);
    setLoadingContact(true);

    (async () => {
      const defaults = await getDefaultExportContact();
      if (!cancelled) {
        setContact(defaults);
        setLoadingContact(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const updateField = (field) => (e) => {
    setContact((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleDownload = async () => {
    if (exporting) return;
    setExporting(true);
    setError(null);

    savePaletteExportContact(contact);

    const result = await downloadPalettePdf({
      palette,
      zones,
      items,
      contact,
      t,
    });

    setExporting(false);

    if (!result.ok) {
      setError(t("palette.export.error"));
      return;
    }

    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={exporting ? undefined : onClose}>
      <div className="modal-sheet palette-export-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{t("palette.export.modal_title")}</h2>
        <p className="palette-picker-subtitle">{t("palette.export.modal_subtitle")}</p>

        {loadingContact && <p className="palette-list-status">{t("palette.export.loading_contact")}</p>}

        {!loadingContact && (
          <div className="palette-export-form">
            <label className="palette-export-field">
              <span className="palette-zone-field-label">{t("palette.export.first_name")}</span>
              <input
                type="text"
                className="palette-zone-input"
                value={contact.firstName}
                onChange={updateField("firstName")}
                autoComplete="given-name"
              />
            </label>
            <label className="palette-export-field">
              <span className="palette-zone-field-label">{t("palette.export.last_name")}</span>
              <input
                type="text"
                className="palette-zone-input"
                value={contact.lastName}
                onChange={updateField("lastName")}
                autoComplete="family-name"
              />
            </label>
            <label className="palette-export-field">
              <span className="palette-zone-field-label">{t("palette.export.phone")}</span>
              <input
                type="tel"
                className="palette-zone-input"
                value={contact.phone}
                onChange={updateField("phone")}
                autoComplete="tel"
              />
            </label>
            <label className="palette-export-field">
              <span className="palette-zone-field-label">{t("palette.export.email")}</span>
              <input
                type="email"
                className="palette-zone-input"
                value={contact.email}
                onChange={updateField("email")}
                autoComplete="email"
              />
            </label>
            <label className="palette-export-field palette-export-field--full">
              <span className="palette-zone-field-label">{t("palette.export.city")}</span>
              <input
                type="text"
                className="palette-zone-input"
                value={contact.city}
                onChange={updateField("city")}
                autoComplete="address-level2"
              />
            </label>
          </div>
        )}

        {error && <p className="palette-list-error">{error}</p>}

        <div className="modal-actions palette-picker-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={exporting}>
            {t("albums.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownload}
            disabled={exporting || loadingContact}
          >
            {exporting ? t("palette.export.generating") : t("palette.export.download")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
