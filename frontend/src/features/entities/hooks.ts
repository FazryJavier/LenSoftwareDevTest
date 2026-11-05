import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listEntities } from './api';

const entityKeys = {
  list: (bbox: string | null) => ['entities', 'list', bbox] as const,
};

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
