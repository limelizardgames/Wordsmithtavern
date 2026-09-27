import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests drive a production build with pretend ads enabled (see .env.e2e).
 * Run: npm run test:e2e
 *
 * The build is served on its own port and never reused, so a `npm run preview` left running on
 * 4173 (a build without pretend ads) can't be picked up by mistake.
 */
const PORT = 4817;
const URL = `http://localhost:${PORT}/`;

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    {
      name: 'tablet',
      use: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: false },
    },
  ],
});
