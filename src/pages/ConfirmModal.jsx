import { useEffect } from "react";

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
  // IMPORTANT: hooks must run on every render — do NOT early-return before them.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [open]);

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

  const icon =
    tone === "success"
      ? "ti-circle-check-filled"
      : tone === "danger"
      ? "ti-alert-octagon"
      : tone === "info"
      ? "ti-info-circle"
      : "ti-alert-triangle";

  return (
    <div
      className="cp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-modal-title"
      >
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