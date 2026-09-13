import { test, expect } from '@playwright/test'
test('Tooltip gap', async ({ page }) => {
  await page.goto('http://localhost:3101/playwright/index.html')
  await page.evaluate(() => {
    window.__playwright_ct_mount('components/Tooltip/Tooltip/Basic')
  })
  await page.waitForTimeout(500)
  const btnB = page.getByTestId('btn-tooltip-b')
  await btnB.hover()
  const contentB = page.getByTestId('tooltip-content-b')
  await expect(contentB).toBeVisible()
  const triggerBox = await btnB.boundingBox()
  const contentBox = await contentB.boundingBox()
  console.log('trigger:', triggerBox)
  console.log('content:', contentBox)
})
