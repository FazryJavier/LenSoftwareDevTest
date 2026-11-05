import { useCallback, useState } from 'react';
import { entityStatusSchema, entityTypeSchema, type EntityStatus, type EntityType } from './schema';

export interface EntityFilters {
  type: EntityType | null;
  status: EntityStatus | null;
}

/** Reads filters from the URL. An unknown value from a broken link counts as no filter. */
export function readFilters(search: string): EntityFilters {
  const params = new URLSearchParams(search);
  const type = entityTypeSchema.safeParse(params.get('type'));
  const status = entityStatusSchema.safeParse(params.get('status'));
  return {
    type: type.success ? type.data : null,
    status: status.success ? status.data : null,
  };
}

function writeFilters({ type, status }: EntityFilters) {
  const url = new URL(window.location.href);
  for (const [name, value] of [
    ['type', type],
    ['status', status],
  ] as const) {
    if (value === null) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
  }
  window.history.replaceState(null, '', url);
}

/** Keeps the filters in the URL, so a reload or a shared link applies the same ones. */
export function useEntityFilters() {
  const [filters, setFiltersState] = useState(() => readFilters(window.location.search));

  const setFilters = useCallback((next: EntityFilters) => {
    writeFilters(next);
    setFiltersState(next);
  }, []);

  return { filters, setFilters };
}
