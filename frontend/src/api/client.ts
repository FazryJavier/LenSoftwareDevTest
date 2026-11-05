import { z } from 'zod';
import { ApiError } from './errors';

const API_BASE_PATH = '/api/v1';

const envelopeSchema = z.object({
  code: z.number(),
  success: z.boolean(),
  message: z.string(),
  data: z.unknown(),
  errors: z
    .array(z.object({ field: z.string().nullable(), code: z.string(), message: z.string() }))
    .nullable(),
  meta: z.unknown(),
});

export interface ApiSuccess {
  data: unknown;
  meta: unknown;
}

/** Sends a request and unwraps the envelope. Every failure is thrown as an ApiError. */
export async function apiRequest(path: string, init?: RequestInit): Promise<ApiSuccess> {
  const response = await send(path, init);
  const envelope = envelopeSchema.safeParse(await readJson(response));

  if (!envelope.success) {
    throw new ApiError(response.status, 'Server mengirim respons yang tidak dikenali.', []);
  }
  if (!envelope.data.success) {
    throw new ApiError(response.status, envelope.data.message, envelope.data.errors ?? []);
  }
  return { data: envelope.data.data, meta: envelope.data.meta };
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_PATH}${path}`, init);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause;
    }
    throw new ApiError(0, 'Tidak dapat menghubungi server.', []);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // A proxy error page is not JSON. The caller reports it as an unknown response.
    return null;
  }
}
