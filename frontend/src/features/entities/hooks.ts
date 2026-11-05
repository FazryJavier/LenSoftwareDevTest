import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getEntity, listEntities } from './api';

const entityKeys = {
  list: (bbox: string | null) => ['entities', 'list', bbox] as const,
  detail: (id: string) => ['entities', 'detail', id] as const,
};

/** Loads one entity. A 404 is a real answer, so failures are not retried automatically. */
export function useEntity(id: string) {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn: ({ signal }) => getEntity(id, signal),
    retry: false,
  });
}

/**
 * Loads the entities inside an area. Earlier markers stay visible while a new area loads,
 * and the area in the key keeps a late response from replacing a newer one.
 */
export function useEntities(bbox: string | null) {
  return useQuery({
    queryKey: entityKeys.list(bbox),
    queryFn: ({ signal }) => {
      if (bbox === null) {
        throw new Error('useEntities ran without an area.');
      }
      return listEntities(bbox, signal);
    },
    enabled: bbox !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
