import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';
import { ApiError } from './errors';

function stubResponse(body: string, status = 200) {
  const fetchStub = vi.fn(() => Promise.resolve(new Response(body, { status })));
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
}

function failure(message: string, code: number) {
  return JSON.stringify({
    code,
    success: false,
    message,
    data: null,
    errors: [{ field: 'latitude', code: 'out_of_range', message: 'Out of range.' }],
    meta: null,
  });
}

async function captureError(path: string): Promise<unknown> {
  try {
    await apiRequest(path);
  } catch (error) {
    return error;
  }
  throw new Error('apiRequest did not throw');
}

describe('apiRequest', () => {
  it('unwraps a successful envelope and calls the versioned path', async () => {
    const fetchStub = stubResponse(
      JSON.stringify({
        code: 200,
        success: true,
        message: 'OK.',
        data: { id: '1' },
        errors: null,
        meta: { page: 1 },
      }),
    );

    await expect(apiRequest('/health')).resolves.toEqual({
      data: { id: '1' },
      meta: { page: 1 },
    });
    expect(fetchStub).toHaveBeenCalledWith('/api/v1/health', undefined);
  });

  it('throws ApiError with the server details for a failed envelope', async () => {
    stubResponse(failure('Validation failed.', 422), 422);

    const error = await captureError('/entities');

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      message: 'Validation failed.',
      items: [{ field: 'latitude', code: 'out_of_range', message: 'Out of range.' }],
    });
  });

  it.each([
    ['a non-JSON body', '<html>Bad Gateway</html>', 502],
    ['JSON that is not an envelope', '{"hello":"world"}', 200],
    ['an empty body', '', 200],
  ])('throws ApiError for %s', async (_label, body, status) => {
    stubResponse(body, status);

    const error = await captureError('/health');

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, items: [] });
  });

  it('throws ApiError with status 0 when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    const error = await captureError('/health');

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
  });

  it('lets an aborted request propagate unchanged', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('Aborted', 'AbortError'))),
    );

    const error = await captureError('/health');

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });
});
