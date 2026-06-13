import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { X } from "lucide-react";

interface AdminDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs text-muted-foreground mb-2 block">{children}</label>;
}

export default function AdminDialog({ open, title, onClose, children, footer, wide }: AdminDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 data-[state=open]:animate-in"
        aria-label="Stäng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative bg-card border border-border/30 rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto ${
          wide ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        <div className="sticky top-0 z-10 bg-card border-b border-border/30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 bg-card border-t border-border/30 px-6 py-4 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-secondary border border-border/30 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
    />
  );
}

export function AdminTextarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-secondary border border-border/30 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${className}`}
    />
  );
}

export function AdminSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-secondary border border-border/30 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
    >
      {children}
    </select>
  );
}
