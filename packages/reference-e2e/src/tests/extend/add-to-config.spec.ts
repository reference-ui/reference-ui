import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getSandboxDir } from '../../environments/lib/config.js'
import { testRoutes } from '../../environments/base/routes.js'

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

test.describe('extend', () => {
  test.describe('config', () => {
    test('base sandbox extends the fixture library baseSystem', async () => {
      const sandboxDir = getSandboxDir()
      const configPath = join(sandboxDir, 'ui.config.ts')
      const content = await readFile(configPath, 'utf-8')

      expect(content).toContain("import { defineConfig } from '@reference-ui/core'")
      expect(content).toContain("import { baseSystem } from '@fixtures/extend-library'")
      expect(content).toContain('defineConfig(')
      expect(content).toContain('reference-e2e')
      expect(content).toContain('extends: [baseSystem]')
    })
  })

  test.describe('runtime', () => {
    test('renders fixture DemoComponent with fixture-owned tokens', async ({ page }) => {
      await page.goto(testRoutes.extends)
      const root = page.getByTestId('extends-test')
      const demo = page.getByTestId('fixture-demo')
      const eyebrow = page.getByTestId('fixture-demo-eyebrow')
      const copy = page.getByTestId('fixture-demo-copy')

      await expect(root).toBeVisible()
      await expect(demo).toBeVisible()
      await expect(eyebrow).toHaveText('Fixture library component')
      await expect(copy).toContainText('DemoComponent renders from @fixtures/extend-library.')

      const bg = await demo.evaluate((e) => getComputedStyle(e).backgroundColor)
      const color = await demo.evaluate((e) => getComputedStyle(e).color)
      const accent = await eyebrow.evaluate((e) => getComputedStyle(e).color)

      expect(bg).toBe(hexToRgb('#0f172a'))
      expect(color).toBe(hexToRgb('#f8fafc'))
      expect(accent).toBe(hexToRgb('#14b8a6'))
    })

    test('renders fixture LightDarkDemo variants from the extend library', async ({
      page,
    }) => {
      await page.goto(testRoutes.extends)
      const demo = page.getByTestId('light-dark-demo')
      const lightCard = page.getByTestId('light-dark-demo-light')
      const darkCard = page.getByTestId('light-dark-demo-dark')

      await expect(demo).toBeVisible()
      await expect(lightCard).toBeVisible()
      await expect(darkCard).toBeVisible()
      await expect(page.getByTestId('light-dark-demo-light-title')).toHaveText('Light mode')
      await expect(page.getByTestId('light-dark-demo-dark-title')).toHaveText('Dark mode')

      const darkBg = await darkCard.evaluate((e) => getComputedStyle(e).backgroundColor)
      const darkColor = await darkCard.evaluate((e) => getComputedStyle(e).color)

      expect(darkBg).toBe(hexToRgb('#020617'))
      expect(darkColor).toBe(hexToRgb('#f8fafc'))
    })
  })
})
