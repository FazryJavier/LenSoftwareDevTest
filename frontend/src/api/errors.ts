export interface ApiErrorItem {
  field: string | null;
  code: string;
  message: string;
}

/** A failed API call. `status` is 0 when no HTTP response was received. */
export class ApiError extends Error {
  readonly status: number;
  readonly items: ApiErrorItem[];

  constructor(status: number, message: string, items: ApiErrorItem[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.items = items;
  }
}
