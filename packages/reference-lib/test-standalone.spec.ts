import { test, expect } from '@playwright/test'
test('is standalone?', async ({ page }) => {
  await page.goto('http://localhost:3101/playwright/index.html')
  const standalone = await page.evaluate(() => window.matchMedia('(display-mode: standalone)').matches)
  console.log('standalone:', standalone)
})
