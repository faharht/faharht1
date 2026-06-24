import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              destructive ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold">{title}</h3>
            <div className="mt-1 text-xs text-muted-foreground">{message}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-9 rounded-md border border-border/60 bg-background px-3 text-xs font-medium hover:bg-muted disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-9 rounded-md px-4 text-xs font-semibold text-white disabled:opacity-60 ${
              destructive ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
