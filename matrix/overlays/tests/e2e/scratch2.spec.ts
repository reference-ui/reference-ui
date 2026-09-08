import { test, expect } from '@playwright/test';

test('debug toggle', async ({ page }) => {
  await page.goto('/overlay/nested');
  
  await page.evaluate(() => {
    window.logCount = 0;
    const btn = document.querySelector('[data-testid="btn-interrupt-toggle"]');
    btn.addEventListener('click', () => { window.logCount++ });
  });

  await page.getByTestId('btn-interrupt-toggle').click({ force: true });
  await page.waitForTimeout(100);
  
  await page.getByTestId('btn-interrupt-toggle').click({ force: true }); // Close
  await page.waitForTimeout(100);
  
  await page.getByTestId('btn-interrupt-toggle').click({ force: true }); // Re-open
  await page.waitForTimeout(400);

  const clicks = await page.evaluate(() => window.logCount);
  console.log("TOTAL CLICKS:", clicks);
});
