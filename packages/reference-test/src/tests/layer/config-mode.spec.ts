import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { colors } from '@reference-ui/lib/theme'
import { addToConfig, getSandboxDir } from '../../environments/lib/config.js'
import { runRefSync, waitForRefSyncReady } from '../../environments/lib/ref-sync.js'

const LAYER_TOKEN_VAR = '--colors-test-primary'
const LAYER_NAME = 'reference-test'
const sandboxDir = getSandboxDir()
const { tokensConfig } = await import(pathToFileURL(join(sandboxDir, 'tokens.ts')).href)

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
}

async function enableLayersMode(): Promise<string> {
  await addToConfig({ extends: '[]', layers: '[baseSystem]' })
  const sandboxDir = getSandboxDir()
  await waitForRefSyncReady(sandboxDir, { timeout: 45_000 })
  return sandboxDir
}

test.describe.serial('layer', () => {
  test('addToConfig with layers only writes valid ui.config.ts', async () => {
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const content = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(content).toContain('layers: [baseSystem]')
    expect(content).toContain("import { baseSystem } from '@reference-ui/lib'")
  })

  test('layers only – styles.css has the consumer layer and [data-layer] token block', async () => {
    test.setTimeout(60_000)
    // Lib is already synced by test:prepare; only sandbox needs sync after config change.
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
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
    const layerTokenInDataLayer = content.indexOf(LAYER_TOKEN_VAR, dataLayerIdx)
    expect(
      layerTokenInDataLayer,
      'consumer token var should appear inside [data-layer] block'
    ).toBeGreaterThan(
      -1
    )
  })

  test('layer prop writes data-layer and preserves other props', async ({ page }) => {
    test.setTimeout(60_000)
    await enableLayersMode()
    await page.goto('/')
    const host = page.getByTestId('consumer-layer-host')
    await expect(host).toBeVisible()
    await expect(host).toHaveAttribute('data-layer', LAYER_NAME)
    await expect(host).toHaveAttribute('id', 'consumer-layer-id')
  })

  test('layer prop scopes consumer tokens to matching subtrees only', async ({ page }) => {
    test.setTimeout(60_000)
    await enableLayersMode()
    await page.goto('/')
    const outside = page.getByTestId('consumer-layer-outside')
    const host = page.getByTestId('consumer-layer-host')
    const mismatchHost = page.getByTestId('consumer-layer-mismatch-host')
    const nestedHost = page.getByTestId('consumer-layer-nested-host')

    const outsideToken = await outside.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )
    const insideToken = await host.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )
    const mismatchToken = await mismatchHost.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )
    const nestedToken = await nestedHost.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )

    expect(outsideToken).toBe('')
    expect(insideToken).toBe(tokensConfig.colors.test.primary.value)
    expect(mismatchToken).toBe('')
    expect(nestedToken).toBe(tokensConfig.colors.test.primary.value)
  })

  test('layer prop resolves var() color only for matching hosts', async ({ page }) => {
    test.setTimeout(60_000)
    await enableLayersMode()
    await page.goto('/')
    const inside = page.getByTestId('consumer-layer-text')
    await expect(inside).toBeVisible()
    const insideColor = await inside.evaluate((e) => getComputedStyle(e).color)
    expect(insideColor).toBe(hexToRgb(tokensConfig.colors.test.primary.value))

    const outside = page.getByTestId('consumer-layer-outside')
    await expect(outside).toBeVisible()
    const outsideToken = await outside.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )
    expect(outsideToken).toBe('')
  })

  test('layers only – upstream theme token renders via data-layer', async ({ page }) => {
    test.setTimeout(60_000)
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
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
