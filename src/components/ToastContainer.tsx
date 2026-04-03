import { useToastStore } from "../store/toastStore";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss"
            className="toast-dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
