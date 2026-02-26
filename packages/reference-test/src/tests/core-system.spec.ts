import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SANDBOX_DIR = join(__dirname, '..', '..', '.sandbox')

test.describe('core-system', () => {
  test('ref sync produces expected artifacts', () => {
    const coreSystemCss = join(SANDBOX_DIR, 'node_modules/@reference-ui/core/src/system/styles.css')
    const reactStyles = join(SANDBOX_DIR, 'node_modules/@reference-ui/react/styles.css')
    expect(
      existsSync(coreSystemCss) || existsSync(reactStyles),
      'Expected core src/system/styles.css or @reference-ui/react/styles.css after sync'
    ).toBe(true)
  })

  test('app renders with reference-ui components', async ({ page }) => {
    await page.goto('/')
    const appBox = page.getByTestId('app-box')
    await expect(appBox).toBeVisible()
    await expect(appBox).toHaveText('Hello')
  })

  test('reference-ui styles are applied', async ({ page }) => {
    await page.goto('/')
    const appBox = page.getByTestId('app-box').first()
    const color = await appBox.evaluate((el) => getComputedStyle(el).color)
    expect(color).toMatch(/^oklch\(/)
  })
})
