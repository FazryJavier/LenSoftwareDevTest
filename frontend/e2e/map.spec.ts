import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';

const ENTITY = {
  id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11',
  name: 'Truk Logistik',
  type: 'vehicle',
  status: 'active',
  description: null,
  attributes: {},
  latitude: -6.9175,
  longitude: 107.6191,
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-05T10:00:00Z',
};

function fulfillList(route: Route, data: unknown[], total = data.length) {
  return route.fulfill({
    json: {
      code: 200,
      success: true,
      message: 'Entities retrieved.',
      data,
      errors: null,
      meta: { page: 1, per_page: 500, total, total_pages: 1 },
    },
  });
}

// Tests must not depend on the internet, so the base map style is served locally.
async function stubBaseMap(page: Page) {
  await page.route(/tiles\.openfreemap\.org/, (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
}

let mapSetupErrors: string[] = [];

// Markers render even when the map's worker is blocked, so these failures must be checked
// directly. In Compose the page also runs behind nginx's Content Security Policy.
test.beforeEach(({ page }) => {
  mapSetupErrors = [];
  page.on('console', (message) => {
    if (/Content Security Policy|Worker failed to load/.test(message.text())) {
      mapSetupErrors.push(message.text());
    }
  });
});

test.afterEach(() => {
  expect(mapSetupErrors).toEqual([]);
});

test('shows a labelled marker from the API and requests the visible area', async ({ page }) => {
  await stubBaseMap(page);
  const request = page.waitForRequest(/\/api\/v1\/entities\?/);
  await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, [ENTITY]));

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Truk Logistik, Kendaraan, Aktif' })).toBeVisible();
  const params = new URL((await request).url()).searchParams;
  expect(params.get('per_page')).toBe('500');
  expect(params.get('bbox')?.split(',')).toHaveLength(4);
});

test('requests a new area after the map is moved', async ({ page }) => {
  await stubBaseMap(page);
  const areas: (string | null)[] = [];
  await page.route(/\/api\/v1\/entities\?/, (route) => {
    areas.push(new URL(route.request().url()).searchParams.get('bbox'));
    return fulfillList(route, [ENTITY]);
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: /Truk Logistik/ })).toBeVisible();

  const map = page.locator('.maplibregl-canvas');
  const box = await map.boundingBox();
  if (box === null) {
    throw new Error('The map canvas is not visible.');
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2 - 100, { steps: 8 });
  await page.mouse.up();

  await expect.poll(() => new Set(areas).size).toBeGreaterThan(1);
});

test('asks to zoom in when the area holds too many entities', async ({ page }) => {
  await stubBaseMap(page);
  await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, [ENTITY], 501));

  await page.goto('/');

  await expect(page.getByText(/Perbesar peta/)).toBeVisible();
});

test('shows an empty message when the area has no entities', async ({ page }) => {
  await stubBaseMap(page);
  await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, []));

  await page.goto('/');

  await expect(page.getByText('Belum ada entitas di area ini.')).toBeVisible();
});

test('recovers from an API failure through the retry button', async ({ page }) => {
  await stubBaseMap(page);
  let failing = true;
  await page.route(/\/api\/v1\/entities\?/, (route) => {
    if (failing) {
      return route.fulfill({
        status: 500,
        json: {
          code: 500,
          success: false,
          message: 'Internal server error.',
          data: null,
          errors: [{ field: null, code: 'internal_error', message: 'Internal server error.' }],
          meta: null,
        },
      });
    }
    return fulfillList(route, [ENTITY]);
  });

  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('gagal dimuat');

  failing = false;
  await page.getByRole('button', { name: 'Coba lagi' }).click();

  await expect(page.getByRole('button', { name: /Truk Logistik/ })).toBeVisible();
});

test('still shows markers when the base map cannot be loaded', async ({ page }) => {
  await page.route(/tiles\.openfreemap\.org/, (route) => route.abort());
  await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, [ENTITY]));

  await page.goto('/');

  await expect(page.getByRole('button', { name: /Truk Logistik/ })).toBeVisible();
});

test.describe('entity details', () => {
  const SECOND = {
    ...ENTITY,
    id: '0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e12',
    name: 'Sensor Gudang',
    type: 'iot_device',
    description: 'Memantau suhu',
    latitude: -7.2575,
    longitude: 112.7521,
  };

  async function stubDetails(page: Page) {
    await stubBaseMap(page);
    await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, [ENTITY, SECOND]));
    await page.route(/\/api\/v1\/entities\/[^?]+$/, (route) =>
      route.fulfill({
        json: {
          code: 200,
          success: true,
          message: 'Entity retrieved.',
          data: route.request().url().endsWith(SECOND.id) ? SECOND : ENTITY,
          errors: null,
          meta: null,
        },
      }),
    );
  }

  test('opens from a marker, switches to another, and closes with Escape', async ({ page }) => {
    await stubDetails(page);
    await page.goto('/');
    const truck = page.getByRole('button', { name: /Truk Logistik/ });

    await truck.click();

    const panel = page.getByRole('complementary', { name: 'Detail entitas' });
    await expect(panel.getByRole('heading', { name: 'Truk Logistik' })).toBeVisible();
    await expect(panel.getByText('-6.91750, 107.61910')).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Tutup detail' })).toBeFocused();
    await expect(truck).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: /Sensor Gudang/ }).click();

    await expect(panel.getByRole('heading', { name: 'Sensor Gudang' })).toBeVisible();
    await expect(panel.getByText('Memantau suhu')).toBeVisible();
    await expect(truck).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Escape');

    await expect(panel).toBeHidden();
    await expect(page.getByRole('button', { name: /Sensor Gudang/ })).toBeFocused();
  });

  test('says when the entity no longer exists', async ({ page }) => {
    await stubBaseMap(page);
    await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, [ENTITY]));
    await page.route(/\/api\/v1\/entities\/[^?]+$/, (route) =>
      route.fulfill({
        status: 404,
        json: {
          code: 404,
          success: false,
          message: 'Entity not found.',
          data: null,
          errors: [{ field: null, code: 'not_found', message: 'Entity not found.' }],
          meta: null,
        },
      }),
    );
    await page.goto('/');

    await page.getByRole('button', { name: /Truk Logistik/ }).click();

    await expect(page.getByRole('alert')).toContainText('tidak ditemukan');
  });
});

test.describe('adding an entity', () => {
  async function openFormOnMap(page: Page) {
    await stubBaseMap(page);
    await page.goto('/');
    await page.locator('.maplibregl-canvas').waitFor();
    await page.getByRole('button', { name: 'Tambah', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Tambah entitas' })).toBeVisible();
  }

  async function clickMapCentre(page: Page) {
    const box = await page.locator('.maplibregl-canvas').boundingBox();
    if (box === null) {
      throw new Error('The map canvas is not visible.');
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  test('saves through the real API and is still there after a reload', async ({ page }) => {
    const name = `E2E Tambah ${String(Date.now())}`;
    await openFormOnMap(page);

    await clickMapCentre(page);

    await expect(page.getByLabel(/Latitude/)).not.toHaveValue('');
    await expect(page.getByLabel(/Longitude/)).not.toHaveValue('');
    await expect(page.getByTestId('draft-marker')).toBeVisible();

    await page.getByLabel(/Nama/).fill(name);
    await page.getByLabel(/Jenis/).selectOption('iot_device');
    await page.getByLabel(/Status/).selectOption('active');
    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByText('Entitas berhasil ditambahkan.')).toBeVisible();
    await expect(page.getByTestId('draft-marker')).toBeHidden();
    const marker = page.getByRole('button', { name: `${name}, Perangkat IoT, Aktif` });
    await expect(marker).toBeVisible();

    await page.reload();

    await expect(marker).toBeVisible();
  });

  test('moves the draft marker to typed coordinates', async ({ page }) => {
    await openFormOnMap(page);

    await page.getByLabel(/Latitude/).fill('-2');
    await page.getByLabel(/Longitude/).fill('118');

    await expect(page.getByTestId('draft-marker')).toBeVisible();
  });

  test('shows validation messages without sending a request', async ({ page }) => {
    let posted = false;
    page.on('request', (request) => {
      posted ||= request.method() === 'POST';
    });
    await openFormOnMap(page);

    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.getByLabel(/Latitude/).fill('91');

    await expect(page.getByText('Nama wajib diisi.')).toBeVisible();
    await expect(page.getByText('Latitude harus antara -90 dan 90.')).toBeVisible();
    expect(posted).toBe(false);
  });

  test('shows a server rejection on the field and keeps the form', async ({ page }) => {
    await page.route(/\/api\/v1\/entities$/, (route) =>
      route.fulfill({
        status: 422,
        json: {
          code: 422,
          success: false,
          message: 'Validation failed.',
          data: null,
          errors: [{ field: 'name', code: 'too_long', message: 'Too long.' }],
          meta: null,
        },
      }),
    );
    await openFormOnMap(page);
    await page.getByLabel(/Nama/).fill('Nama');
    await page.getByLabel(/Jenis/).selectOption('other');
    await page.getByLabel(/Status/).selectOption('active');
    await page.getByLabel(/Latitude/).fill('0');
    await page.getByLabel(/Longitude/).fill('0');

    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.getByText('Isinya terlalu panjang.')).toBeVisible();
    await expect(page.getByLabel(/Nama/)).toHaveValue('Nama');
  });

  test('asks before discarding changes, including from the Escape key', async ({ page }) => {
    await openFormOnMap(page);
    const form = page.getByRole('complementary', { name: 'Tambah entitas' });
    await page.getByLabel(/Nama/).fill('Sementara');

    await page.keyboard.press('Escape');
    const dialog = page.getByRole('dialog', { name: 'Buang perubahan?' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel(/Nama/)).toHaveValue('Sementara');

    await page.getByRole('button', { name: 'Batal' }).click();
    await page.getByRole('button', { name: 'Buang' }).click();

    await expect(form).toBeHidden();
    await expect(page.getByRole('button', { name: 'Tambah', exact: true })).toBeFocused();
  });

  test('keeps the form open when a marker is clicked', async ({ page }) => {
    await page.route(/\/api\/v1\/entities\?/, (route) => fulfillList(route, [ENTITY]));
    await openFormOnMap(page);

    await page.getByRole('button', { name: /Truk Logistik/ }).click();

    await expect(page.getByRole('complementary', { name: 'Tambah entitas' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Detail entitas' })).toBeHidden();
  });
});

test.describe('creating through the real API', () => {
  const VALID = { name: 'E2E API', type: 'other', status: 'active', latitude: 0, longitude: 0 };

  test('answers 201 with a Location that returns the same entity', async ({ request }) => {
    const created = await request.post('/api/v1/entities', { data: VALID });

    expect(created.status()).toBe(201);
    const location = created.headers().location ?? '';
    expect(location).toMatch(/^\/api\/v1\/entities\/[0-9a-f-]{36}$/);

    const fetched = await request.get(location);
    expect(fetched.status()).toBe(200);
    expect(await fetched.json()).toMatchObject({
      data: { name: 'E2E API', latitude: 0, longitude: 0, description: null, attributes: {} },
    });
  });

  test('answers 422 with every violation', async ({ request }) => {
    const response = await request.post('/api/v1/entities', {
      data: { name: '', type: 'spaceship', latitude: 91 },
    });

    expect(response.status()).toBe(422);
    expect(await response.json()).toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'name', code: 'required' }),
        expect.objectContaining({ field: 'type', code: 'invalid_enum' }),
        expect.objectContaining({ field: 'status', code: 'required' }),
        expect.objectContaining({ field: 'latitude', code: 'out_of_range' }),
        expect.objectContaining({ field: 'longitude', code: 'required' }),
      ]),
    });
  });

  test('answers 400 for an unknown field and 415 for the wrong content type', async ({
    request,
  }) => {
    const unknownField = await request.post('/api/v1/entities', {
      data: { ...VALID, owner: 'me' },
    });
    expect(unknownField.status()).toBe(400);
    expect(await unknownField.json()).toMatchObject({
      errors: [{ field: 'owner', code: 'unknown_field' }],
    });

    const wrongType = await request.post('/api/v1/entities', {
      headers: { 'Content-Type': 'text/plain' },
      data: JSON.stringify(VALID),
    });
    expect(wrongType.status()).toBe(415);
  });
});

test.describe('changing an entity through the real API', () => {
  async function createEntity(request: APIRequestContext, latitude: number, longitude: number) {
    const name = `E2E Ubah ${String(Date.now())} ${String(longitude)}`;
    const response = await request.post('/api/v1/entities', {
      data: {
        name,
        type: 'vehicle',
        status: 'active',
        description: 'Awal',
        attributes: { plate_number: 'D 1' },
        latitude,
        longitude,
      },
    });
    expect(response.status()).toBe(201);
    return { name, location: response.headers().location ?? '' };
  }

  async function openEditForm(page: Page, name: string) {
    await stubBaseMap(page);
    await page.goto('/');
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.getByRole('button', { name: 'Ubah', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Ubah entitas' })).toBeVisible();
  }

  test('saves new data and location, which remain after a reload', async ({ page, request }) => {
    const { name, location } = await createEntity(request, 3, 110);
    const newName = `${name} Baru`;
    await openEditForm(page, name);
    await expect(page.getByLabel(/Nama/)).toHaveValue(name);
    await expect(page.getByLabel('Key')).toHaveValue('plate_number');

    await page.getByLabel(/Nama/).fill(newName);
    const canvas = await page.locator('.maplibregl-canvas').boundingBox();
    if (canvas === null) {
      throw new Error('The map canvas is not visible.');
    }
    await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
    await expect(page.getByLabel(/Latitude/)).not.toHaveValue('3');
    const latitude = Number(await page.getByLabel(/Latitude/).inputValue());
    await page.getByRole('button', { name: 'Simpan' }).click();

    const panel = page.getByRole('complementary', { name: 'Detail entitas' });
    await expect(panel.getByRole('heading', { name: newName })).toBeVisible();
    await expect(page.getByText('Perubahan berhasil disimpan.')).toBeVisible();
    const marker = page.getByRole('button', { name: new RegExp(newName) });
    await expect(marker).toBeVisible();

    await page.reload();
    await expect(marker).toBeVisible();

    const saved: unknown = await (await request.get(location)).json();
    expect(saved).toMatchObject({
      data: { name: newName, latitude, attributes: { plate_number: 'D 1' } },
    });
  });

  test('follows a dragged marker', async ({ page, request }) => {
    const { name } = await createEntity(request, 5, 108);
    await openEditForm(page, name);
    const draft = page.getByTestId('draft-marker');
    await expect(draft).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeHidden();

    const box = await draft.boundingBox();
    if (box === null) {
      throw new Error('The draft marker is not visible.');
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 80, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByLabel(/Latitude/)).not.toHaveValue('5');
    await expect(page.getByLabel(/Longitude/)).not.toHaveValue('108');
  });

  test('puts everything back when cancelled', async ({ page, request }) => {
    const { name, location } = await createEntity(request, 1, 112);
    await openEditForm(page, name);
    await page.getByLabel(/Nama/).fill('Tidak jadi');
    await page.getByLabel(/Latitude/).fill('-8');

    await page.getByRole('button', { name: 'Batal' }).click();
    await page.getByRole('button', { name: 'Buang' }).click();

    const panel = page.getByRole('complementary', { name: 'Detail entitas' });
    await expect(panel.getByRole('heading', { name })).toBeVisible();
    await expect(panel.getByText('1.00000, 112.00000')).toBeVisible();
    await expect(page.getByTestId('draft-marker')).toBeHidden();
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();

    expect(await (await request.get(location)).json()).toMatchObject({
      data: { name, latitude: 1 },
    });
  });

  test('says when the entity disappeared before saving', async ({ page, request }) => {
    const { name } = await createEntity(request, -1, 114);
    await page.route(/\/api\/v1\/entities\/[^?]+$/, (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({
            status: 404,
            json: {
              code: 404,
              success: false,
              message: 'Entity not found.',
              data: null,
              errors: [{ field: null, code: 'not_found', message: 'Entity not found.' }],
              meta: null,
            },
          })
        : route.continue(),
    );
    await openEditForm(page, name);
    await page.getByLabel(/Nama/).fill('Berubah');

    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.getByRole('alert')).toContainText('tidak ditemukan');
    await expect(page.getByLabel(/Nama/)).toHaveValue('Berubah');
  });

  test('the API answers 200, 400, 404, and 422 for PUT', async ({ request }) => {
    const { location } = await createEntity(request, -3, 116);
    const valid = {
      name: 'E2E Ubah API',
      type: 'other',
      status: 'inactive',
      latitude: 0,
      longitude: 0,
    };

    const updated = await request.put(location, { data: valid });
    expect(updated.status()).toBe(200);
    expect(await updated.json()).toMatchObject({
      data: { name: 'E2E Ubah API', description: null, attributes: {}, latitude: 0 },
    });

    const invalidId = await request.put('/api/v1/entities/not-a-uuid', { data: valid });
    expect(invalidId.status()).toBe(400);

    const missing = await request.put('/api/v1/entities/00000000-0000-4000-8000-000000000000', {
      data: valid,
    });
    expect(missing.status()).toBe(404);

    const invalid = await request.put(location, { data: { ...valid, latitude: 91 } });
    expect(invalid.status()).toBe(422);
    expect(await (await request.get(location)).json()).toMatchObject({
      data: { name: 'E2E Ubah API', latitude: 0 },
    });
  });
});

test('the real API rejects an invalid entity ID through the proxy', async ({ request }) => {
  const response = await request.get('/api/v1/entities/not-a-uuid');

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    code: 400,
    success: false,
    errors: [{ field: 'id', code: 'invalid_id' }],
  });
});

test('the real API answers 404 for an unknown entity through the proxy', async ({ request }) => {
  const response = await request.get('/api/v1/entities/00000000-0000-4000-8000-000000000000');

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({
    code: 404,
    success: false,
    message: 'Entity not found.',
    errors: [{ field: null, code: 'not_found' }],
  });
});

test('the real API answers through the proxy with the list contract', async ({ request }) => {
  const response = await request.get('/api/v1/entities?bbox=-180,-90,180,90&per_page=1');

  expect(response.status()).toBe(200);
  const body: unknown = await response.json();
  expect(body).toMatchObject({
    code: 200,
    success: true,
    errors: null,
    meta: { page: 1, per_page: 1 },
  });
  expect(body).toHaveProperty('data', expect.any(Array));
});

test('the real API rejects an invalid area through the proxy', async ({ request }) => {
  const response = await request.get('/api/v1/entities?bbox=bad');

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    code: 400,
    success: false,
    errors: [{ field: 'bbox', code: 'invalid_query' }],
  });
});
