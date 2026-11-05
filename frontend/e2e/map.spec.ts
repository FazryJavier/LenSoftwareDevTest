import { expect, test, type Page, type Route } from '@playwright/test';

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
