import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { REF_LIB_CANARY } from '@reference-ui/lib'
import { addToConfig, getSandboxDir } from '../../environments/lib/config.js'
import { runRefSync, waitForRefSyncReady } from '../../environments/lib/ref-sync.js'

const CANARY_VAR = '--colors-ref-lib-canary'
const LAYER_NAME = 'reference-ui'

test.describe.serial('layer', () => {
  test('addToConfig with layers only writes valid ui.config.ts', async () => {
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    const content = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(content).toContain('layers: [baseSystem]')
    expect(content).toContain("import { baseSystem } from '@reference-ui/lib'")
  })

  test('layers only – styles.css has @layer reference-ui and [data-layer] with canary', async () => {
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
    const canaryInDataLayer = content.indexOf(CANARY_VAR, dataLayerIdx)
    expect(canaryInDataLayer, 'canary var should appear inside [data-layer] block').toBeGreaterThan(
      -1
    )
  })

  test('layers only – refLibCanary renders via data-layer', async ({ page }) => {
    test.setTimeout(60_000)
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    await waitForRefSyncReady(sandboxDir, { timeout: 45_000 })
    await page.goto('/')
    const inside = page.getByTestId('layers-test')
    await expect(inside).toBeVisible()
    const insideColor = await inside.evaluate((e) => getComputedStyle(e).color)
    expect(insideColor).toBe(REF_LIB_CANARY)
    const outside = page.getByTestId('layers-outside')
    await expect(outside).toBeVisible()
    const outsideColor = await outside.evaluate((e) => getComputedStyle(e).color)
    expect(outsideColor).not.toBe(REF_LIB_CANARY)
  })


})
