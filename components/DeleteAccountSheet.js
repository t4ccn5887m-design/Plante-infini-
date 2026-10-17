import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { deleteMyAccount } from "@/lib/accountDeletion";

const CONFIRM_WORD = "SUPPRIMER";
const DELETE_ERROR =
  "La suppression n'a pas pu aboutir. Rien n'a été supprimé côté compte. Réessayez ou écrivez-nous.";

export default function DeleteAccountSheet({ open, onClose }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setBusy(false);
      setError(null);
    }
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const canDelete = confirmText.trim() === CONFIRM_WORD && !busy;

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError(null);
    const result = await deleteMyAccount();
    if (!result.ok) {
      setBusy(false);
      setError(DELETE_ERROR);
    }
  };

  return createPortal(
    <div className="wilder-account-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="wilder-account-sheet wilder-delete-account-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wilder-account-sheet-head">
          <h3 id="delete-account-title" className="wilder-v2-title-section">
            Supprimer mon compte
          </h3>
          <button
            type="button"
            className="wilder-account-sheet-close"
            onClick={onClose}
            aria-label="Fermer"
            disabled={busy}
          >
            ×
          </button>
        </div>

        <p className="wilder-delete-account-lead">
          Cette action est définitive. Seront supprimés : votre compte, votre dossier jardin, vos
          coups de cœur et vos photos. Si vous êtes paysagiste : votre studio, vos liens clients,
          les briefs reçus, vos rendez-vous et vos réalisations.
        </p>

        <label className="wilder-account-field">
          <span>Tapez {CONFIRM_WORD} pour confirmer</span>
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={busy}
            placeholder={CONFIRM_WORD}
          />
        </label>

        {error ? (
          <p className="wilder-delete-account-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="wilder-account-btn-danger"
          disabled={!canDelete}
          onClick={handleDelete}
        >
          {busy ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button
          type="button"
          className="wilder-account-btn-outline"
          onClick={onClose}
          disabled={busy}
        >
          Annuler
        </button>
      </div>
    </div>,
    document.body
  );
}
