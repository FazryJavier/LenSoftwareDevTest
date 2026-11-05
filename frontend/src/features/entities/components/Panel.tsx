import { X } from 'lucide-react';
import type { ReactNode, Ref } from 'react';

interface PanelProps {
  label: string;
  title: string;
  onClose: () => void;
  closeLabel: string;
  closeRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

/** Floats over the map, so opening it does not resize the map or reload its data. */
export function Panel({ label, title, onClose, closeLabel, closeRef, children }: PanelProps) {
  return (
    <aside
      aria-label={label}
      className="absolute inset-x-0 bottom-0 z-10 max-h-1/2 overflow-y-auto rounded-t-lg border border-border bg-surface p-4 shadow-md md:top-4 md:right-4 md:bottom-auto md:left-auto md:max-h-11/12 md:w-90 md:rounded-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold break-words">{title}</h2>
        <button
          ref={closeRef}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-text-muted hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
    </aside>
  );
}
