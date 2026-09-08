import { test, expect } from '@playwright/test';

test('debug interrupted teardown', async ({ page }) => {
  await page.goto('/overlay/nested');
  await page.getByTestId('btn-interrupt-toggle').click({ force: true });
  await page.waitForTimeout(100);
  
  await page.getByTestId('btn-interrupt-toggle').click({ force: true }); // Close
  await page.waitForTimeout(100);
  
  await page.getByTestId('btn-interrupt-toggle').click({ force: true }); // Re-open
  await page.waitForTimeout(400);

  const html = await page.content();
  console.log("HTML AFTER RE-OPEN:", html.substring(html.indexOf('interrupted-fixture-root'), html.indexOf('interrupted-fixture-root') + 1000));
});
