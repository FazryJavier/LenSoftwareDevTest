import { z } from 'zod';

export const entityTypeSchema = z.enum(['vehicle', 'iot_device', 'facility', 'other']);
export const entityStatusSchema = z.enum(['active', 'inactive', 'maintenance']);

export const entitySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: entityTypeSchema,
  status: entityStatusSchema,
  description: z.string().nullable(),
  attributes: z.record(z.string(), z.string()),
  latitude: z.number(),
  longitude: z.number(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
});

export type EntityType = z.infer<typeof entityTypeSchema>;
export type EntityStatus = z.infer<typeof entityStatusSchema>;
export type Entity = z.infer<typeof entitySchema>;
