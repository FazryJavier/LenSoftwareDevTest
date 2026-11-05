import { z } from 'zod';
import { entityStatusSchema, entityTypeSchema, type Entity } from './schema';

// The rules follow docs/PRD.md section 5. The backend applies them again and has the final say.
const MAX_NAME = 100;
const MAX_DESCRIPTION = 500;
const MAX_ATTRIBUTES = 20;
const MAX_ATTRIBUTE_VALUE = 200;
const ATTRIBUTE_KEY = /^[A-Za-z0-9_.-]{1,50}$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;

/** Counts characters the way the backend does, so emoji are not counted twice. */
const characterCount = (value: string) => Array.from(value).length;

function coordinateSchema(label: string, limit: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .regex(DECIMAL, `${label} harus berupa angka, misalnya -6.9175.`)
    .transform(Number)
    .refine(
      (value) => Math.abs(value) <= limit,
      `${label} harus antara -${String(limit)} dan ${String(limit)}.`,
    );
}

const latitudeSchema = coordinateSchema('Latitude', 90);
const longitudeSchema = coordinateSchema('Longitude', 180);

export const entityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama wajib diisi.')
    .refine(
      (value) => characterCount(value) <= MAX_NAME,
      `Nama maksimal ${String(MAX_NAME)} karakter.`,
    ),
  type: z.string().min(1, 'Pilih jenis entitas.').pipe(entityTypeSchema),
  status: z.string().min(1, 'Pilih status entitas.').pipe(entityStatusSchema),
  description: z
    .string()
    .trim()
    .refine(
      (value) => characterCount(value) <= MAX_DESCRIPTION,
      `Deskripsi maksimal ${String(MAX_DESCRIPTION)} karakter.`,
    )
    .transform((value) => (value === '' ? null : value)),
  attributes: z
    .array(
      z.object({
        key: z
          .string()
          .trim()
          .regex(ATTRIBUTE_KEY, 'Gunakan 1–50 huruf, angka, atau tanda . _ - tanpa spasi.'),
        value: z
          .string()
          .refine(
            (value) => characterCount(value) <= MAX_ATTRIBUTE_VALUE,
            `Nilai maksimal ${String(MAX_ATTRIBUTE_VALUE)} karakter.`,
          ),
      }),
    )
    .max(MAX_ATTRIBUTES, `Maksimal ${String(MAX_ATTRIBUTES)} atribut.`)
    .superRefine((attributes, context) => {
      const seen = new Set<string>();
      attributes.forEach(({ key }, index) => {
        if (seen.has(key)) {
          context.addIssue({
            code: 'custom',
            message: 'Key atribut sudah dipakai.',
            path: [index, 'key'],
          });
        }
        seen.add(key);
      });
    })
    .transform((attributes) =>
      Object.fromEntries(attributes.map(({ key, value }) => [key, value])),
    ),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export type EntityFormValues = z.input<typeof entityFormSchema>;
export type EntityPayload = z.output<typeof entityFormSchema>;

export const EMPTY_ENTITY_FORM: EntityFormValues = {
  name: '',
  type: '',
  status: '',
  description: '',
  attributes: [],
  latitude: '',
  longitude: '',
};

/** Fills the form with an existing entity's values. */
export function toFormValues(entity: Entity): EntityFormValues {
  return {
    name: entity.name,
    type: entity.type,
    status: entity.status,
    description: entity.description ?? '',
    attributes: Object.entries(entity.attributes).map(([key, value]) => ({ key, value })),
    latitude: String(entity.latitude),
    longitude: String(entity.longitude),
  };
}

export interface MapPoint {
  latitude: number;
  longitude: number;
}

/** Returns the point when both typed coordinates are valid, so the map can preview it. */
export function parseDraftLocation(latitude: string, longitude: string): MapPoint | null {
  const parsedLatitude = latitudeSchema.safeParse(latitude);
  const parsedLongitude = longitudeSchema.safeParse(longitude);
  if (!parsedLatitude.success || !parsedLongitude.success) {
    return null;
  }
  return { latitude: parsedLatitude.data, longitude: parsedLongitude.data };
}
