import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { colors } from '@reference-ui/lib/theme'
import { addToConfig, getSandboxDir } from '../../environments/lib/config.js'
import { runRefSync, waitForRefSyncReady } from '../../environments/lib/ref-sync.js'

const FOUNDATION_VAR = '--colors-teal-500'
const LAYER_NAME = 'reference-test'

test.describe.serial('layer', () => {
  test('addToConfig with layers only writes valid ui.config.ts', async () => {
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    const content = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(content).toContain('layers: [baseSystem]')
    expect(content).toContain("import { baseSystem } from '@reference-ui/lib'")
  })

  test('layers only – styles.css has @layer reference-test and [data-layer] with theme tokens', async () => {
    test.setTimeout(60_000)
    // Lib is already synced by test:prepare; only sandbox needs sync after config change.
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    await runRefSync(sandboxDir)
    const stylesPath = join(sandboxDir, '.reference-ui', 'react', 'styles.css')
    const content = await readFile(stylesPath, 'utf-8')
    expect(content, 'styles.css should contain layer block from baseSystem').toContain(
      `@layer ${LAYER_NAME} {`
    )
    expect(content, 'styles.css should contain data-layer token block').toContain(
      `[data-layer="${LAYER_NAME}"]`
    )
    const dataLayerIdx = content.indexOf(`[data-layer="${LAYER_NAME}"]`)
    const foundationTokenInDataLayer = content.indexOf(FOUNDATION_VAR, dataLayerIdx)
    expect(
      foundationTokenInDataLayer,
      'theme token var should appear inside [data-layer] block'
    ).toBeGreaterThan(
      -1
    )
  })

  test.skip('layers only – theme token renders via data-layer', async ({ page }) => {
    test.setTimeout(60_000)
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    await waitForRefSyncReady(sandboxDir, { timeout: 45_000 })
    await page.goto('/')
    const inside = page.getByTestId('layers-test')
    await expect(inside).toBeVisible()
    const insideColor = await inside.evaluate((e) =>
      getComputedStyle(e.parentElement as HTMLElement).getPropertyValue('--colors-teal-500').trim()
    )
    expect(insideColor).toBe(colors.teal[500].value)
    const outside = page.getByTestId('layers-outside')
    await expect(outside).toBeVisible()
    const outsideColor = await outside.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-teal-500').trim()
    )
    expect(outsideColor).not.toBe(colors.teal[500].value)
  })


})
