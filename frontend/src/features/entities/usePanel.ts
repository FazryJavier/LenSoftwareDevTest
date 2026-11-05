import { useCallback, useEffect, useRef, useState } from 'react';

import type { Entity } from './schema';

type PanelMode =
  | { kind: 'idle' }
  | { kind: 'detail'; id: string }
  | { kind: 'create' }
  | { kind: 'edit'; entity: Entity };

/** Tracks what the side panel shows, and where keyboard focus returns when it closes. */
export function usePanel() {
  const [mode, setMode] = useState<PanelMode>({ kind: 'idle' });
  const trigger = useRef<HTMLElement | null>(null);

  const isFormOpen = mode.kind === 'create' || mode.kind === 'edit';

  const selectEntity = useCallback(
    (id: string, element: HTMLElement) => {
      // Opening details here would throw away what the user typed into the form.
      if (isFormOpen) {
        return;
      }
      trigger.current = element;
      setMode({ kind: 'detail', id });
    },
    [isFormOpen],
  );

  const openCreate = useCallback((element: HTMLElement) => {
    trigger.current = element;
    setMode({ kind: 'create' });
  }, []);

  const openEdit = useCallback((entity: Entity) => {
    setMode({ kind: 'edit', entity });
  }, []);

  /** Leaves a form: a change returns to its entity, and an addition closes the panel. */
  const cancelForm = useCallback(() => {
    setMode((current) =>
      current.kind === 'edit' ? { kind: 'detail', id: current.entity.id } : { kind: 'idle' },
    );
  }, []);

  const showDetail = useCallback((id: string) => {
    setMode({ kind: 'detail', id });
  }, []);

  /** Pass a focus target when the element that opened the panel no longer exists. */
  const close = useCallback((focusTarget?: HTMLElement | null) => {
    if (focusTarget !== undefined) {
      trigger.current = focusTarget;
    }
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
      // An open dialog handles its own Escape key, and the panel behind it stays open.
      if (event.key === 'Escape' && document.querySelector('dialog[open]') === null) {
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
    isFormOpen,
    isCreating: mode.kind === 'create',
    editingEntity: mode.kind === 'edit' ? mode.entity : null,
    selectEntity,
    openCreate,
    openEdit,
    cancelForm,
    showDetail,
    close,
  };
}
