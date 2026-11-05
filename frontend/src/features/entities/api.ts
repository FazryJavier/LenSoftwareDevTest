import { z } from 'zod';
import { apiRequest } from '../../api/client';
import { ApiError } from '../../api/errors';
import { entitySchema, paginationMetaSchema, type Entity } from './schema';

/** The API's maximum page size. The map asks users to zoom in beyond this many entities. */
const ENTITIES_PER_VIEW = 500;

const entityListSchema = z.object({
  data: z.array(entitySchema),
  meta: paginationMetaSchema,
});

export interface EntityList {
  entities: Entity[];
  total: number;
}

export async function listEntities(bbox: string, signal?: AbortSignal): Promise<EntityList> {
  const query = new URLSearchParams({ bbox, per_page: String(ENTITIES_PER_VIEW) });
  const response = await apiRequest(`/entities?${query.toString()}`, { signal });

  const parsed = entityListSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(200, 'Server mengirim data entitas yang tidak dikenali.', []);
  }
  return { entities: parsed.data.data, total: parsed.data.meta.total };
}
