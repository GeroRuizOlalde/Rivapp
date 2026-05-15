import { defineConfig, devices } from '@playwright/test';

/**
 * Config de Playwright para la smoke suite de Rivapp.
 *
 * Por defecto levanta `npm run dev` (Vite en :5173) y corre los tests contra
 * localhost. Podés apuntar a otro entorno con E2E_BASE_URL, por ejemplo:
 *   E2E_BASE_URL=https://www.rivapp.com.ar npx playwright test
 * (en ese caso no se levanta servidor local).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  ...(useLocalServer
    ? {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
