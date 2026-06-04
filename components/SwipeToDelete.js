import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const ACTION_WIDTH = 92;
const OPEN_THRESHOLD = 44;

export default function SwipeToDelete({
  children,
  onDelete,
  deleteLabel,
  confirmMessage,
  cancelLabel,
  confirmLabel,
  className = "",
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const wrapRef = useRef(null);

  const clamp = (v) => Math.max(-ACTION_WIDTH, Math.min(0, v));
  const isOpen = offset <= -OPEN_THRESHOLD;

  const snap = useCallback((value) => {
    setOffset(value <= -OPEN_THRESHOLD ? -ACTION_WIDTH : 0);
  }, []);

  const close = useCallback(() => setOffset(0), []);

  useEffect(() => {
    if (!isOpen) return;
    const onDocPointer = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [isOpen, close]);

  const onPointerDown = (e) => {
    if (confirming) return;
    if (e.target.closest(".swipe-delete-action-btn")) return;
    startX.current = e.clientX;
    startOffset.current = offset;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    setOffset(clamp(startOffset.current + dx));
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    snap(offset);
  };

  const onPointerCancel = () => {
    setDragging(false);
    snap(offset);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = () => {
    setConfirming(false);
    close();
    onDelete?.();
  };

  const handleCancel = () => {
    setConfirming(false);
    close();
  };

  const panelStyle = {
    transform: `translateX(${offset}px)`,
    transition: dragging ? "none" : "transform 0.22s ease",
  };

  return (
    <>
      <div ref={wrapRef} className={`swipe-delete-wrap ${className}`.trim()}>
        <div className="swipe-delete-action" aria-hidden={!isOpen}>
          <button
            type="button"
            className="swipe-delete-action-btn"
            onClick={handleDeleteClick}
            tabIndex={isOpen ? 0 : -1}
          >
            {deleteLabel}
          </button>
        </div>
        <div
          className="swipe-delete-panel"
          style={panelStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {children}
        </div>
      </div>

      {confirming &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="modal-overlay" role="presentation" onClick={handleCancel}>
            <div
              className="modal-sheet swipe-delete-confirm"
              role="alertdialog"
              aria-labelledby="swipe-delete-confirm-title"
              onClick={(e) => e.stopPropagation()}
            >
              <p id="swipe-delete-confirm-title" className="swipe-delete-confirm-msg">
                {confirmMessage}
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  className="btn-primary swipe-delete-confirm-btn"
                  onClick={handleConfirm}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
