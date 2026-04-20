import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { addToConfig, getSandboxDir, resetConfig } from '../../environments/lib/config'
import { tokensConfig } from '../../environments/base/tokens-config'
import { runRefSync } from '../../environments/lib/ref-sync'
import { testRoutes } from '../../environments/base/routes'

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

function computedEquivalent(value: string): string {
  const rem = /^([\d.]+)rem$/.exec(value)
  if (rem) return `${Number.parseFloat(rem[1]) * 16}px`
  return value
}

test.describe.serial('jsxElements', () => {
  test.afterAll(async () => {
    const sandboxDir = getSandboxDir()
    await resetConfig()
    await runRefSync(sandboxDir)
  })

  test('config escape hatch styles a local custom JSX component', async ({ page }) => {
    const sandboxDir = getSandboxDir()

    await addToConfig({ jsxElements: ['TestMarker'] })
    await runRefSync(sandboxDir)

    const configContent = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(configContent).toContain("jsxElements")
    expect(configContent).toContain("TestMarker")

    const baseSystemContent = await readFile(
      join(sandboxDir, '.reference-ui', 'system', 'baseSystem.mjs'),
      'utf-8'
    )
    expect(baseSystemContent).toContain('TestMarker')

    await page.goto(testRoutes.jsxElements)
    const marker = page.getByTestId('jsx-elements-marker')

    await expect(marker).toBeVisible()
    await expect(marker).toContainText('Local custom JSX element styled via ui.config.jsxElements')

    const backgroundColor = await marker.evaluate((element) => getComputedStyle(element).backgroundColor)
    const padding = await marker.evaluate((element) => getComputedStyle(element).padding)
    const borderRadius = await marker.evaluate((element) => getComputedStyle(element).borderRadius)

    expect(backgroundColor).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
    expect(padding).toBe(computedEquivalent(tokensConfig.spacing['test-md'].value))
    expect(borderRadius).toBe(computedEquivalent(tokensConfig.radii['test-round'].value))
  })
})