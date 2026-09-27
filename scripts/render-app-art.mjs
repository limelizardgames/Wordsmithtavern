#!/usr/bin/env node
/**
 * Renders the app icon and splash source images (assets/*.png) from the game's own SVG art.
 * Needs the dev server running (npm run dev). Then: npx @capacitor/assets generate
 *
 *   node scripts/render-app-art.mjs [http://localhost:5173/]
 */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5173/';
const jobs = [
  { hash: 'art-icon', file: 'assets/icon-only.png', size: 1024, transparent: false },
  { hash: 'art-icon-fg', file: 'assets/icon-foreground.png', size: 1024, transparent: true },
  { hash: 'art-icon-bg', file: 'assets/icon-background.png', size: 1024, transparent: false },
  { hash: 'art-splash', file: 'assets/splash.png', size: 2732, transparent: false },
];

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage({
    viewport: { width: job.size, height: job.size },
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}#${job.hash}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (job.transparent) {
    await page.addStyleTag({ content: 'html, body, #app { background: transparent !important; }' });
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: job.file, omitBackground: job.transparent });
  console.log('wrote', job.file);
  await page.close();
}
await browser.close();
