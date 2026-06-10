import { createPortal } from "react-dom";

export default function DeleteConfirmDialog({
  open,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-sheet swipe-delete-confirm"
        role="alertdialog"
        aria-labelledby="delete-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="delete-confirm-title" className="swipe-delete-confirm-msg">
          {message}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-primary swipe-delete-confirm-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
