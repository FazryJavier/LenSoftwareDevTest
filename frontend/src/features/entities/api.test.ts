import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/errors';
import { listEntities } from './api';

const ENTITY = {
  id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11',
  name: 'Truk',
  type: 'vehicle',
  status: 'active',
  description: null,
  attributes: {},
  latitude: -6.9175,
  longitude: 107.6191,
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-05T10:00:00Z',
};

function stubList(data: unknown, meta: unknown) {
  const body = JSON.stringify({
    code: 200,
    success: true,
    message: 'OK.',
    data,
    errors: null,
    meta,
  });
  const fetchStub = vi.fn<(url: string) => Promise<Response>>(() =>
    Promise.resolve(new Response(body)),
  );
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
}

const META = { page: 1, per_page: 500, total: 1, total_pages: 1 };

describe('listEntities', () => {
  it('requests the area with the maximum page size and returns the entities', async () => {
    const fetchStub = stubList([ENTITY], META);

    const result = await listEntities('106,-7,108,-6', { type: null, status: null });

    expect(result).toEqual({ entities: [ENTITY], total: 1 });
    const params = new URL(fetchStub.mock.calls[0]?.[0] ?? '', 'http://localhost').searchParams;
    expect(params.get('bbox')).toBe('106,-7,108,-6');
    expect(params.get('per_page')).toBe('500');
    expect(params.has('type')).toBe(false);
    expect(params.has('status')).toBe(false);
  });

  it('adds the active filters to the request', async () => {
    const fetchStub = stubList([ENTITY], META);

    await listEntities('106,-7,108,-6', { type: 'vehicle', status: 'maintenance' });

    const params = new URL(fetchStub.mock.calls[0]?.[0] ?? '', 'http://localhost').searchParams;
    expect(params.get('type')).toBe('vehicle');
    expect(params.get('status')).toBe('maintenance');
  });

  it.each([
    ['an unknown type', [{ ...ENTITY, type: 'spaceship' }], META],
    ['an unknown status', [{ ...ENTITY, status: 'lost' }], META],
    ['a text coordinate', [{ ...ENTITY, latitude: '-6.9' }], META],
    ['a missing field', [{ ...ENTITY, description: undefined }], META],
    ['data that is not a list', { id: '1' }, META],
    ['missing pagination', [ENTITY], null],
  ])('rejects a response with %s', async (_label, data, meta) => {
    stubList(data, meta);

    await expect(
      listEntities('106,-7,108,-6', { type: null, status: null }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
