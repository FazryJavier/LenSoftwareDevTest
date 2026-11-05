import { useCallback, useEffect, useRef, useState } from 'react';

type PanelMode = { kind: 'idle' } | { kind: 'detail'; id: string } | { kind: 'create' };

/** Tracks what the side panel shows, and where keyboard focus returns when it closes. */
export function usePanel() {
  const [mode, setMode] = useState<PanelMode>({ kind: 'idle' });
  const trigger = useRef<HTMLElement | null>(null);

  const isCreating = mode.kind === 'create';

  const selectEntity = useCallback(
    (id: string, element: HTMLElement) => {
      // Opening details here would throw away what the user typed into the form.
      if (isCreating) {
        return;
      }
      trigger.current = element;
      setMode({ kind: 'detail', id });
    },
    [isCreating],
  );

  const openCreate = useCallback((element: HTMLElement) => {
    trigger.current = element;
    setMode({ kind: 'create' });
  }, []);

  const showDetail = useCallback((id: string) => {
    setMode({ kind: 'detail', id });
  }, []);

  const close = useCallback(() => {
    setMode({ kind: 'idle' });
  }, []);

  // After the render, because the element that opened the form is disabled until it closes.
  const isIdle = mode.kind === 'idle';
  useEffect(() => {
    if (isIdle) {
      trigger.current?.focus();
      trigger.current = null;
    }
  }, [isIdle]);

  const isShowingDetail = mode.kind === 'detail';
  useEffect(() => {
    if (!isShowingDetail) {
      return;
    }
    // On the document, because focus may be on the map or a marker rather than the panel.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isShowingDetail, close]);

  return {
    selectedId: mode.kind === 'detail' ? mode.id : null,
    isCreating,
    selectEntity,
    openCreate,
    showDetail,
    close,
  };
}
