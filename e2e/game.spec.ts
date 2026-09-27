import { expect, test } from '@playwright/test';
import {
  cookOrder,
  dismissPopups,
  order,
  saveData,
  screenName,
  seasonedSave,
  serveTheNight,
  startWith,
  tapThroughDialogue,
  waitForCooking,
} from './helpers';

test('a brand-new player meets Barley and gets through their first night', async ({ page }) => {
  await startWith(page, null);
  await page.locator('.title-screen').click();
  // Barley introduces the tavern, then the first guest walks in.
  await expect(page.locator('.dialogue-name')).toContainText('Barley');
  await tapThroughDialogue(page);
  await expect(page.locator('.hud-title-main')).toHaveText('Night 1');

  // The very first guest is Barnaby, with the start of his story. Swipe the first order.
  await waitForCooking(page);
  await expect(page.locator('.bubble-guest, .coach')).toBeVisible();
  await cookOrder(page, { swipe: true });
  await expect(page.locator('.payout')).toBeVisible();

  await serveTheNight(page);
  await expect(page.locator('.summary-orders li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Close up for the night' }).click();

  // Barley's pep talk after the first night, then the daily tip jar.
  await tapThroughDialogue(page);
  await expect(page.locator('.modal')).toContainText('Barley’s Tip Jar');
  const before = (await saveData(page)).coins;
  await page.locator('.modal .btn-gold').click();
  await expect.poll(async () => (await saveData(page)).coins).toBeGreaterThan(before);

  const save = await saveData(page);
  expect(save.day).toBe(2);
  expect(save.guests.barnaby.chapter).toBe(1);
  expect(await screenName(page)).toBe('hub');
});

test('Taste Test reveals a letter, and serving early pays for what is in the pot', async ({
  page,
}) => {
  await startWith(page, seasonedSave());
  await page.locator('.title-screen').click();
  await page.getByRole('button', { name: 'Open for the night' }).click();
  await waitForCooking(page);

  const coins = (await saveData(page)).coins;
  await page.getByRole('button', { name: /Taste Test hint/ }).click();
  await page.getByRole('button', { name: /Taste for 15 coins/ }).click();
  await expect(page.locator('.slot.is-hinted .slot-box.has-letter')).toHaveCount(1);
  expect((await saveData(page)).coins).toBe(coins - 15);

  await page.getByRole('button', { name: 'Serve early' }).click();
  await page.getByRole('button', { name: 'Serve it as it is' }).click();
  await expect(page.locator('.payout')).toBeVisible();
  await expect(page.locator('.payout .stars')).toHaveAttribute('aria-label', '1 out of 5 stars');
});

test('a rewarded ad doubles the night, and pacing keeps interstitials away early on', async ({
  page,
}) => {
  await startWith(page, seasonedSave());
  await page.locator('.title-screen').click();
  await page.getByRole('button', { name: 'Open for the night' }).click();
  await serveTheNight(page);
  await dismissPopups(page);

  const before = (await saveData(page)).coins;
  const double = page.getByRole('button', { name: /double tonight’s coins/ });
  await expect(double).toBeVisible();
  const bonus = Number((await double.innerText()).match(/\+(\d+)/)![1]);
  await double.click();
  await expect(page.locator('.mock-ad')).toBeVisible();
  await expect(page.locator('.mock-ad-close')).toBeVisible({ timeout: 8_000 });
  await page.locator('.mock-ad-close').click();
  await expect.poll(async () => (await saveData(page)).coins).toBe(before + bonus);
  await expect(double).toBeHidden();

  // Night 4 completed right after a rewarded ad: no interstitial.
  await page.getByRole('button', { name: 'Close up for the night' }).click();
  await expect.poll(() => screenName(page)).toBe('hub');
  await expect(page.locator('.mock-ad')).toBeHidden();
});

test('closing a rewarded ad early gives no reward', async ({ page }) => {
  await startWith(page, seasonedSave());
  await page.locator('.title-screen').click();
  await page.getByRole('button', { name: 'Open for the night' }).click();
  await waitForCooking(page);
  const hinted = async () => (await order(page))!.slots.filter((s) => s.hint).length;
  await page.getByRole('button', { name: /Taste Test hint/ }).click();
  await page.getByRole('button', { name: /Free taste: watch an ad/ }).click();
  await page.getByRole('button', { name: 'Close early (no reward)' }).click();
  await expect(page.locator('.mock-ad')).toBeHidden();
  expect(await hinted()).toBe(0);
});

test('decor bought in the shop goes on display and survives a reload', async ({ page }) => {
  await startWith(page, seasonedSave({ coins: 1000 }));
  await page.locator('.title-screen').click();
  await page.locator('.hub-row .btn', { hasText: 'Decor' }).click();
  await page.getByRole('tab', { name: /Lighting/ }).click();
  const lanterns = page.locator('.item-card', { hasText: 'Brass Lanterns' });
  await lanterns.getByRole('button', { name: /100/ }).click();
  await expect(lanterns).toContainText('On display');
  expect((await saveData(page)).furniture.placed.lights).toBe('lights-lanterns');

  await page.waitForTimeout(600);
  await page.reload();
  await page.locator('.title-screen').click();
  const save = await saveData(page);
  expect(save.coins).toBe(900);
  expect(save.furniture.placed.lights).toBe('lights-lanterns');
});

test('the guest book lets you re-read a tale', async ({ page }) => {
  await startWith(page, seasonedSave());
  await page.locator('.title-screen').click();
  await page.locator('.hub-row .btn', { hasText: 'Guests' }).click();
  await page.getByRole('button', { name: /^Barnaby Bramblefoot/ }).click();
  await expect(page.locator('.tale')).toHaveCount(5);
  await page
    .locator('.tale', { hasText: 'A Bard Arrives' })
    .getByRole('button', { name: 'Read' })
    .click();
  await expect(page.locator('.dialogue-name')).toContainText('Barnaby');
  await tapThroughDialogue(page);
  await expect(page.locator('.dialogue')).toBeHidden();
});
