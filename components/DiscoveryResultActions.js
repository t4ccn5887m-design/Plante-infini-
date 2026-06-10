import { useMemo, useState, useEffect } from "react";
import { createT, getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { shareDiscovery, SHARE_FORMATS, generateShareImage } from "@/lib/share";

export default function DiscoveryResultActions({
  discovery,
  t,
  lang,
  onScanAgain,
  scanAgainLabel,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFormat, setShareFormat] = useState("story");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sharing, setSharing] = useState(false);

  const tr = useMemo(() => createT(lang), [lang]);
  const typeLbl = (type) => getTypeLabel(tr, type);
  const rarityLbl = (r) => getRarityLabel(tr, r);

  useEffect(() => {
    if (!shareOpen || !discovery) {
      setPreviewUrl(null);
      return undefined;
    }
    let cancelled = false;
    generateShareImage(discovery, t, typeLbl, rarityLbl, shareFormat).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [shareOpen, shareFormat, discovery, t, typeLbl, rarityLbl]);

  const handleShare = async () => {
    if (!discovery) return;
    setSharing(true);
    try {
      await shareDiscovery(discovery, t, typeLbl, rarityLbl, shareFormat);
      setShareOpen(false);
    } catch {
      /* user cancelled */
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <div className="discovery-result-actions">
        <button
          type="button"
          className="discovery-result-btn discovery-result-btn--scan"
          onClick={onScanAgain}
        >
          {scanAgainLabel || t("discovery.scan_again")}
        </button>

        <button
          type="button"
          className="discovery-result-btn discovery-result-btn--share"
          onClick={() => setShareOpen(true)}
          disabled={sharing || !discovery}
        >
          {sharing ? t("discovery.share_generating") : t("discovery.share")}
        </button>
      </div>

      {shareOpen && (
        <div className="modal-overlay" onClick={() => setShareOpen(false)}>
          <div className="modal-sheet share-format-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{t("discovery.share_choose_format")}</h2>
            {previewUrl && (
              <img
                src={previewUrl}
                alt={t("discovery.share_preview_alt")}
                className="share-format-preview-img"
              />
            )}
            <div className="share-format-grid">
              {Object.entries(SHARE_FORMATS).map(([id, spec]) => (
                <button
                  key={id}
                  type="button"
                  className={`share-format-btn share-format-btn--${id}${shareFormat === id ? " active" : ""}`}
                  onClick={() => setShareFormat(id)}
                  disabled={sharing}
                >
                  <span className="share-format-preview" aria-hidden="true" />
                  <span>{t(spec.labelKey)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary share-format-confirm"
              onClick={handleShare}
              disabled={sharing || !previewUrl}
            >
              {sharing ? t("discovery.share_generating") : t("discovery.share")}
            </button>
            <button
              type="button"
              className="btn-secondary discovery-result-actions-cancel"
              onClick={() => setShareOpen(false)}
            >
              {t("albums.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
