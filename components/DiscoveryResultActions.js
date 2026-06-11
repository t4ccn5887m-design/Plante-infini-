import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { createT, getRarityLabel, getTypeLabel } from "@/lib/i18n";
import { shareDiscovery } from "@/lib/share";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function DiscoveryResultActions({
  discovery,
  t,
  lang,
  onScanAgain,
  scanAgainLabel,
  onDelete,
  deleteLabels,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const sentinelRef = useRef(null);

  const tr = useMemo(() => createT(lang), [lang]);
  const typeLbl = (type) => getTypeLabel(tr, type);
  const rarityLbl = (r) => getRarityLabel(tr, r);

  const checkReveal = useCallback(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight - 8) {
      setRevealed(true);
    }
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;

    checkReveal();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);

    window.addEventListener("scroll", checkReveal, { passive: true });
    window.addEventListener("resize", checkReveal);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkReveal);
      window.removeEventListener("resize", checkReveal);
    };
  }, [checkReveal]);

  const handleShareOption = async (mode) => {
    if (!discovery) return;
    setSharing(true);
    try {
      const format = mode === "native" ? "feed" : "story";
      await shareDiscovery(discovery, t, typeLbl, rarityLbl, format);
      setShareOpen(false);
    } catch {
      /* annulé */
    } finally {
      setSharing(false);
    }
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmOpen(false);
    onDelete?.();
  };

  return (
    <>
      <div className="discovery-result-actions-wrap">
        <div ref={sentinelRef} className="discovery-result-actions-sentinel" aria-hidden="true" />

        <div
          className={`discovery-result-actions${revealed ? " discovery-result-actions--revealed" : ""}`}
          aria-hidden={!revealed}
        >
          <button
            type="button"
            className="discovery-result-btn discovery-result-btn--light"
            onClick={onScanAgain}
          >
            {scanAgainLabel || t("discovery.scan_again")}
          </button>

          <button
            type="button"
            className="discovery-result-btn discovery-result-btn--light"
            onClick={() => setShareOpen(true)}
            disabled={sharing || !discovery}
          >
            {sharing ? t("discovery.share_generating") : t("discovery.share")}
          </button>

          {onDelete && (
            <button
              type="button"
              className="discovery-result-btn discovery-result-btn--delete"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {t("discovery.delete_action")}
            </button>
          )}
        </div>
      </div>

      {shareOpen && (
        <div className="modal-overlay" onClick={() => !sharing && setShareOpen(false)}>
          <div className="modal-sheet share-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{t("discovery.share_menu_title")}</h2>
            <div className="share-menu-options">
              <button
                type="button"
                className="share-menu-option"
                onClick={() => handleShareOption("native")}
                disabled={sharing}
              >
                {t("discovery.share_native")}
              </button>
              <button
                type="button"
                className="share-menu-option"
                onClick={() => handleShareOption("instagram")}
                disabled={sharing}
              >
                {t("discovery.share_instagram_story")}
              </button>
              <button
                type="button"
                className="share-menu-option"
                onClick={() => handleShareOption("facebook")}
                disabled={sharing}
              >
                {t("discovery.share_facebook_story")}
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary discovery-result-actions-cancel"
              onClick={() => setShareOpen(false)}
              disabled={sharing}
            >
              {t("albums.cancel")}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        message={deleteLabels?.confirmMessage || t("discovery.delete_confirm")}
        cancelLabel={deleteLabels?.cancelLabel || t("albums.cancel")}
        confirmLabel={deleteLabels?.confirmLabel || t("discovery.delete_action")}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
