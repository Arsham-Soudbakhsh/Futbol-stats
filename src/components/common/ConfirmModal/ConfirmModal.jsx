import { useEffect } from "react";
import "./ConfirmModal.css";

/**
 * Generic confirm dialog with icon, message and Cancel / Confirm buttons.
 * Handles ESC / Enter, body scroll lock, and backdrop click-to-close.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  tone = "warning", // "warning" | "success" | "danger" | "info"
}) {
  // Lock body scroll while open via <html> overflow. Compared to
  // position:fixed on body this avoids the iOS visual jump.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, [open]);

  // Keyboard shortcuts.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const icon = pickIcon(tone);

  return (
    <div
      className="cp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-modal-title">
        <div className={`cp-modal__icon cp-modal__icon--${tone}`}>
          <i className={`ti ${icon}`} />
        </div>

        <h3 id="cp-modal-title">{title}</h3>
        {message && <p>{message}</p>}

        <div className="cp-modal__actions">
          <button type="button" className="btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function pickIcon(tone) {
  if (tone === "success") return "ti-circle-check-filled";
  if (tone === "danger") return "ti-alert-octagon";
  if (tone === "info") return "ti-info-circle";
  return "ti-alert-triangle";
}
