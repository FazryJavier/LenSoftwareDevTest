import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/errors';
import { createEntity, deleteEntity, getEntity, listEntities, updateEntity } from './api';
import type { EntityPayload } from './formSchema';
import type { EntityFilters } from './useEntityFilters';

const entityKeys = {
  lists: ['entities', 'list'] as const,
  list: (bbox: string | null, filters: EntityFilters) =>
    [...entityKeys.lists, bbox, filters] as const,
  detail: (id: string) => ['entities', 'detail', id] as const,
};

/** Creates an entity, then reloads the map so it shows what was actually saved. */
export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEntity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entityKeys.lists }),
  });
}

/** Saves changes. The panel shows the saved values at once, and the map reloads its markers. */
export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EntityPayload }) =>
      updateEntity(id, payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(entityKeys.detail(saved.id), saved);
      return queryClient.invalidateQueries({ queryKey: entityKeys.lists });
    },
  });
}

/** Deletes an entity. A 404 means it is already gone, so the map is refreshed in that case too. */
export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEntity,
    onSettled: (_data, error, id) => {
      if (error !== null && !(error instanceof ApiError && error.status === 404)) {
        return;
      }
      queryClient.removeQueries({ queryKey: entityKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: entityKeys.lists });
    },
  });
}

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
export function useEntities(bbox: string | null, filters: EntityFilters) {
  return useQuery({
    queryKey: entityKeys.list(bbox, filters),
    queryFn: ({ signal }) => {
      if (bbox === null) {
        throw new Error('useEntities ran without an area.');
      }
      return listEntities(bbox, filters, signal);
    },
    enabled: bbox !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
