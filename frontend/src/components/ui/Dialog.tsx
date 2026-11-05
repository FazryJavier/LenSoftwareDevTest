import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  children: ReactNode;
  /** Called for every way of dismissing the dialog, including the Escape key. */
  onDismiss: () => void;
  actions: ReactNode;
}

export function Dialog({ title, children, onDismiss, actions }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // The parent decides by unmounting, so the browser must not close it first.
        event.preventDefault();
        onDismiss();
      }}
      className="m-auto w-full max-w-sm rounded-lg border border-border bg-surface p-4 text-text shadow-md backdrop:bg-text/40"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-2 text-sm">{children}</div>
      <div className="mt-4 flex justify-end gap-2">{actions}</div>
    </dialog>
  );
}
