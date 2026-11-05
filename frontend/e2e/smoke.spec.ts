import { expect, test } from '@playwright/test';

test('the page reaches the backend through the frontend proxy', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'GeoEntity Manager' })).toBeVisible();
  await expect(page.getByText('Backend terhubung')).toBeVisible();
});

test('the health endpoint answers with the standard envelope through the proxy', async ({
  request,
}) => {
  const response = await request.get('/api/v1/health');

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    code: 200,
    success: true,
    message: 'Service is healthy.',
    data: null,
    errors: null,
    meta: null,
  });
});
