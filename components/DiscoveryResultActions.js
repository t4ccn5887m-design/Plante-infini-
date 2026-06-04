import { useMemo, useState } from "react";
import { createT, getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { shareDiscovery } from "@/lib/share";

export const ORGANIZE_DESTINATIONS = [
  { id: "potager", emoji: "🥕", titleKey: "themes.potager.title" },
  { id: "randos", emoji: "🥾", titleKey: "themes.randos.title" },
  { id: "jardin", emoji: "🌳", titleKey: "themes.jardin.title" },
  { id: "juniors", emoji: "🦊", titleKey: "nav.juniors" },
];

function OrganizeDestinationModal({ open, onClose, onSelect, t }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{t("discovery.organize_title")}</h2>
        <div className="theme-picker-grid">
          {ORGANIZE_DESTINATIONS.map((dest) => (
            <button
              key={dest.id}
              type="button"
              className="theme-picker-btn"
              onClick={() => onSelect(dest.id)}
            >
              <span className="theme-picker-emoji">{dest.emoji}</span>
              <span>{t(dest.titleKey)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary discovery-result-actions-cancel"
          onClick={onClose}
        >
          {t("albums.cancel")}
        </button>
      </div>
    </div>
  );
}

export default function DiscoveryResultActions({
  discovery,
  t,
  lang,
  onScanAgain,
  onOrganizeDestination,
  scanAgainLabel,
  organizeHint,
}) {
  const [organizeOpen, setOrganizeOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const tr = useMemo(() => createT(lang), [lang]);
  const typeLbl = (type) => getTypeLabel(tr, type);
  const rarityLbl = (r) => getRarityLabel(tr, r);

  const handleShare = async () => {
    if (!discovery) return;
    setSharing(true);
    try {
      await shareDiscovery(discovery, t, typeLbl, rarityLbl);
    } catch {
      /* user cancelled */
    } finally {
      setSharing(false);
    }
  };

  const handleOrganize = (themeId) => {
    setOrganizeOpen(false);
    onOrganizeDestination?.(themeId);
  };

  return (
    <>
      <div className="discovery-result-actions">
        <button
          type="button"
          className="discovery-result-btn discovery-result-btn--organize"
          onClick={() => setOrganizeOpen(true)}
        >
          <span aria-hidden="true">📂</span>
          <span>{t("discovery.organize_in")}</span>
          {organizeHint ? (
            <span className="discovery-result-btn-hint">{organizeHint}</span>
          ) : null}
        </button>

        <button
          type="button"
          className="discovery-result-btn discovery-result-btn--scan"
          onClick={onScanAgain}
        >
          <span aria-hidden="true">📸</span>
          <span>{scanAgainLabel || t("discovery.scan_again")}</span>
        </button>

        <button
          type="button"
          className="discovery-result-btn discovery-result-btn--share"
          onClick={handleShare}
          disabled={sharing || !discovery}
        >
          <span aria-hidden="true">📤</span>
          <span>{sharing ? t("discovery.share_generating") : t("discovery.share")}</span>
        </button>
      </div>

      <OrganizeDestinationModal
        open={organizeOpen}
        onClose={() => setOrganizeOpen(false)}
        onSelect={handleOrganize}
        t={t}
      />
    </>
  );
}
