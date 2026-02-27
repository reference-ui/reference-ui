import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tokensConfig } from '../lib/ref-config/tokens'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getSandboxDir(): string {
  const project = process.env.REF_TEST_PROJECT
  if (!project) throw new Error('REF_TEST_PROJECT required (set by run-matrix.ts)')
  return join(__dirname, '..', '..', '.sandbox', project)
}

/** Hex to rgb string for comparing with getComputedStyle */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
}

test.describe('core-system', () => {
  test('ref sync produces expected artifacts', () => {
    const sandboxDir = getSandboxDir()
    const reactStyles = join(sandboxDir, 'node_modules/@reference-ui/react/styles.css')
    expect(existsSync(reactStyles), 'Expected @reference-ui/react/styles.css after sync').toBe(true)
  })

  test.describe('tokens', () => {
    test('TokensTest mounts', async ({ page }) => {
      await page.goto('/')
      const root = page.getByTestId('tokens-test')
      await expect(root).toBeVisible()
    })

    test('tokens() – primitive uses custom color from config', async ({ page }) => {
      await page.goto('/')
      const el = page.getByTestId('tokens-primitive')
      await expect(el).toBeVisible()
      const color = await el.evaluate((e) => getComputedStyle(e).color)
      const expected = hexToRgb(tokensConfig.colors.test.primary.value)
      expect(color).toBe(expected)
    })

    test('tokens() – css() resolves custom color and bg from config', async ({ page }) => {
      await page.goto('/')
      const el = page.getByTestId('tokens-css')
      await expect(el).toBeVisible()
      const color = await el.evaluate((e) => getComputedStyle(e).color)
      const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor)
      expect(color).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
      expect(bg).toBe(hexToRgb(tokensConfig.colors.test.muted.value))
    })
  })
})
