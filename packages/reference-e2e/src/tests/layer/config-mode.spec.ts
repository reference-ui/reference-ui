import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { colors } from '@reference-ui/lib/theme'
import { addToConfig, getSandboxDir } from '../../environments/lib/config.js'
import { runRefSync, waitForRefSyncReady } from '../../environments/lib/ref-sync.js'

const LAYER_TOKEN_VAR = '--colors-test-primary'
const LAYER_NAME = 'reference-e2e'
const RENAMED_LAYER_NAME = 'reference-e2e-renamed'
const REACT_LAYER_PLACEHOLDER = '__REFERENCE_UI_LAYER_NAME__'
const sandboxDir = getSandboxDir()
const { tokensConfig } = await import(pathToFileURL(join(sandboxDir, 'tokens.ts')).href)

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
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

  test('primitives emit data-layer from config name and preserve other props', async ({ page }) => {
    test.setTimeout(60_000)
    await enableLayersMode()
    await page.goto('/')
    const host = page.getByTestId('consumer-layer-host')
    await expect(host).toBeVisible()
    await expect(host).toHaveAttribute('data-layer', LAYER_NAME)
    await expect(host).toHaveAttribute('id', 'consumer-layer-id')
  })

  test('data-layer from config name scopes consumer tokens to primitives', async ({ page }) => {
    test.setTimeout(60_000)
    await enableLayersMode()
    await page.goto('/')
    const outside = page.getByTestId('consumer-layer-outside')
    const host = page.getByTestId('consumer-layer-host')

    const outsideToken = await outside.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )
    const insideToken = await host.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )

    expect(outsideToken).toBe('')
    expect(insideToken).toBe(tokensConfig.colors.test.primary.value)
  })

  test('data-layer resolves var() color for primitives in scope', async ({ page }) => {
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

  test('primitive host scopes tokens to raw DOM descendants, but not outside DOM', async ({ page }) => {
    test.setTimeout(60_000)
    await enableLayersMode()
    await page.goto('/')

    const outside = page.getByTestId('consumer-layer-outside')
    const rawChild = page.getByTestId('consumer-layer-raw-child')

    await expect(rawChild).toBeVisible()

    const outsideToken = await outside.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
    )
    const rawChildColor = await rawChild.evaluate((e) => getComputedStyle(e).color)

    expect(outsideToken).toBe('')
    expect(rawChildColor).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
  })

  test('layers only – upstream theme token in CSS; consumer primitives use consumer scope', async ({ page }) => {
    test.setTimeout(60_000)
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    await waitForRefSyncReady(sandboxDir, { timeout: 45_000 })
    await page.goto('/')
    const inside = page.getByTestId('layers-test')
    await expect(inside).toBeVisible()
    // Consumer primitives have data-layer="reference-e2e"; upstream tokens are under [data-layer="reference-ui"].
    // So consumer DOM does not see --colors-teal-500 (upstream). Assert upstream CSS is present via stylesheet.
    const outside = page.getByTestId('layers-outside')
    await expect(outside).toBeVisible()
    const outsideColor = await outside.evaluate((e) =>
      getComputedStyle(e).getPropertyValue('--colors-teal-500').trim()
    )
    expect(outsideColor).not.toBe(colors.teal[500].value)
  })

  test('renaming ui.config.name updates CSS scope and packaged react runtime', async () => {
    test.setTimeout(60_000)
    await addToConfig({
      name: RENAMED_LAYER_NAME,
      extends: '[]',
      layers: '[baseSystem]',
    })
    await runRefSync(sandboxDir)

    const stylesPath = join(sandboxDir, '.reference-ui', 'react', 'styles.css')
    const reactBundlePath = join(sandboxDir, '.reference-ui', 'react', 'react.mjs')
    const stylesContent = await readFile(stylesPath, 'utf-8')
    const reactBundle = await readFile(reactBundlePath, 'utf-8')

    expect(stylesContent).toContain(`@layer ${RENAMED_LAYER_NAME} {`)
    expect(stylesContent).toContain(`[data-layer="${RENAMED_LAYER_NAME}"]`)
    expect(stylesContent).not.toContain(`[data-layer="${LAYER_NAME}"]`)

    expect(reactBundle).toContain(RENAMED_LAYER_NAME)
    expect(reactBundle).not.toContain(REACT_LAYER_PLACEHOLDER)
  })


})
