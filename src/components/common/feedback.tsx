"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button, type Tone } from "./ui";
import { cn } from "@/lib/cn";

/* ---------- Toasts ---------- */
type Toast = { id: number; message: string; tone: Tone };
const ToastCtx = createContext<(message: string, tone?: Tone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((message: string, tone: Tone = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const tones: Record<Tone, string> = {
    ok: "border-ok-fg/30 bg-ok-bg text-ok-fg",
    warn: "border-warn-fg/30 bg-warn-bg text-warn-fg",
    bad: "border-bad-fg/30 bg-bad-bg text-bad-fg",
    info: "border-info-fg/30 bg-info-bg text-info-fg",
    neutral: "border-line bg-white text-ink",
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex max-w-md items-start gap-3 rounded-control border px-4 py-3 text-sm shadow-card", tones[t.tone])}>
            <span>{t.message}</span>
            <button type="button" aria-label="Dismiss notification" className="-m-1 p-1" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Modal (native <dialog>: focus trap + Esc handled by the browser) ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cn("m-auto w-[calc(100%-2rem)] rounded-card border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-black/40", wide ? "max-w-2xl" : "max-w-md")}
    >
      {open && (
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 id="modal-title" className="text-lg font-bold text-brand-900">{title}</h2>
            <button type="button" aria-label="Close dialog" onClick={onClose} className="-m-1 rounded p-1 hover:bg-earth-100"><X className="size-5" aria-hidden /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmationDialog({
  open, title, body, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel, danger, confirmDisabled, children,
}: {
  open: boolean; title: string; body?: ReactNode; confirmLabel: string; cancelLabel?: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean; confirmDisabled?: boolean; children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {body && <div className="text-sm text-muted">{body}</div>}
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/** Local placeholder preview for demo documents. Never presents anything as an executed agreement. */
export function DemoDocumentPreview({ open, onClose, title, category }: { open: boolean; onClose: () => void; title: string; category: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="rounded-control border border-dashed border-line bg-earth-50 p-5 text-sm">
        <p className="mb-2 inline-block rounded bg-neutral-bg px-2 py-0.5 text-xs font-bold text-neutral-fg">DEMONSTRATION MATERIAL — {category.toUpperCase()}</p>
        <p>This is a placeholder preview. It is not a legal agreement, receipt, or statement, and it has not been executed or issued by any real entity.</p>
        <p className="mt-3 text-muted">In a live product, the document generated from approved templates and a trusted transaction record would appear here.</p>
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
}
