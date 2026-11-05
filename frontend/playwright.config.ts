import { defineConfig, devices } from '@playwright/test';

// Tests run against the application started by docker compose.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
