import { useEffect, useRef } from 'react';

const DISMISS_AFTER_MS = 5000;

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  const dismiss = useRef(onDismiss);

  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dismiss.current();
    }, DISMISS_AFTER_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  return (
    <div
      role="status"
      className="absolute bottom-4 left-4 z-20 max-w-xs rounded-lg border border-status-active bg-surface px-4 py-3 text-sm text-status-active shadow-md"
    >
      {message}
    </div>
  );
}
