import { ApiError, type ApiErrorItem } from '../../api/errors';

const FORM_FIELDS = ['name', 'type', 'status', 'description', 'latitude', 'longitude'] as const;
export type FormField = (typeof FORM_FIELDS)[number];

const MESSAGES_BY_CODE: Record<string, string> = {
  required: 'Wajib diisi.',
  too_long: 'Isinya terlalu panjang.',
  too_many: 'Jumlahnya terlalu banyak.',
  invalid_enum: 'Pilihan tidak dikenali.',
  invalid_format: 'Formatnya tidak valid.',
  invalid_type: 'Jenis isinya tidak sesuai.',
  out_of_range: 'Nilainya di luar rentang yang diizinkan.',
};

const GENERAL_FAILURE = 'Entitas gagal disimpan. Periksa koneksi, lalu coba lagi.';

function messageFor(item: ApiErrorItem): string {
  return MESSAGES_BY_CODE[item.code] ?? item.message;
}

function isFormField(field: string | null): field is FormField {
  return FORM_FIELDS.some((name) => name === field);
}

export interface FormErrors {
  fields: { name: FormField; message: string }[];
  attributes: string | null;
  general: string | null;
}

/** Sorts a failed save into messages for the form's fields, its attributes, and the form itself. */
export function toFormErrors(error: unknown): FormErrors {
  if (!(error instanceof ApiError) || error.status !== 422) {
    return { fields: [], attributes: null, general: GENERAL_FAILURE };
  }

  const result: FormErrors = { fields: [], attributes: null, general: null };
  for (const item of error.items) {
    if (isFormField(item.field)) {
      result.fields.push({ name: item.field, message: messageFor(item) });
    } else if (item.field?.startsWith('attributes') === true) {
      result.attributes ??= messageFor(item);
    } else {
      result.general ??= messageFor(item);
    }
  }
  return result;
}
