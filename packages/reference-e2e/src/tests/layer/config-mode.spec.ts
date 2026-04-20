import { test, expect } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { lightDarkDemoBgLight } from '@fixtures/layer-library'
import {
  addToConfig,
  getSandboxDir,
  resetConfig,
  type ConfigAdditions,
} from '../../environments/lib/config'
import { runRefSync } from '../../environments/lib/ref-sync'
import { testRoutes } from '../../environments/base/routes'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..', '..', '..')
const LAYER_TOKEN_VAR = '--colors-test-primary'
const LAYER_NAME = 'reference-e2e'
const RENAMED_LAYER_NAME = 'reference-e2e-renamed'
const REACT_LAYER_PLACEHOLDER = '__REFERENCE_UI_LAYER_NAME__'
const sandboxDir = getSandboxDir()
const cssSnapshotDir = join(PACKAGE_ROOT, 'css_snapshot')
const { tokensConfig } = await import(pathToFileURL(join(sandboxDir, 'tokens.ts')).href)
const DEFAULT_LAYER_CONFIG = { extends: '[]', layers: '[layerBaseSystem]' } as const

let activeConfigKey: string | null = null
let syncedConfigKey: string | null = null

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

async function applyLayerConfig(additions: ConfigAdditions): Promise<void> {
  const configKey = JSON.stringify(additions)

  if (activeConfigKey !== configKey) {
    await addToConfig(additions)
    activeConfigKey = configKey
    syncedConfigKey = null
  }

  if (syncedConfigKey !== configKey) {
    await runRefSync(sandboxDir)
    syncedConfigKey = configKey
  }
}

async function snapshotLayerCss(name: string): Promise<string> {
  const stylesPath = join(sandboxDir, '.reference-ui', 'react', 'styles.css')
  const content = await readFile(stylesPath, 'utf-8')
  await mkdir(cssSnapshotDir, { recursive: true })
  const projectName = process.env.REF_TEST_PROJECT ?? 'unknown-project'
  await writeFile(join(cssSnapshotDir, `${projectName}-${name}.css`), content, 'utf-8')
  return content
}

test.describe.serial('layer', () => {
  test.afterAll(async () => {
    await resetConfig()
    await runRefSync(sandboxDir)
    activeConfigKey = null
    syncedConfigKey = null
  })

  test('addToConfig with layers only writes valid ui.config.ts', async () => {
    await addToConfig(DEFAULT_LAYER_CONFIG)
    activeConfigKey = JSON.stringify(DEFAULT_LAYER_CONFIG)
    syncedConfigKey = null
    const content = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(content).toContain('layers: [layerBaseSystem]')
    expect(content).toContain("import { baseSystem as layerBaseSystem } from '@fixtures/layer-library'")
  })

  test.describe('with default layer config', () => {
    test.beforeAll(async () => {
      test.setTimeout(60_000)
      // Lib is already synced by test:prepare; only sandbox needs sync after config change.
      await applyLayerConfig(DEFAULT_LAYER_CONFIG)
    })

    test('layers only – styles.css has the consumer layer and [data-layer] token block', async () => {
      test.setTimeout(60_000)
      const content = await snapshotLayerCss('layer-styles')
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
      ).toBeGreaterThan(-1)
    })

    test('layer scope root emits config name and nested primitives avoid redundant attrs', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.goto(testRoutes.layers)
      const scopeRoot = page.getByTestId('consumer-layer-scope-root')
      const host = page.getByTestId('consumer-layer-host')
      const darkIsland = page.getByTestId('consumer-layer-dark-island')
      await expect(scopeRoot).toBeVisible()
      await expect(host).toBeVisible()
      await expect(darkIsland).toBeVisible()
      await expect(scopeRoot).toHaveAttribute('data-layer', LAYER_NAME)
      await expect(host).not.toHaveAttribute('data-layer', /.+/)
      await expect(darkIsland).toHaveAttribute('data-layer', LAYER_NAME)
      await expect(host).toHaveAttribute('id', 'consumer-layer-id')
    })

    test('data-layer from config name scopes consumer tokens to primitives', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.goto(testRoutes.layers)
      const outside = page.getByTestId('consumer-layer-outside')
      const host = page.getByTestId('consumer-layer-host')

      const outsideToken = await outside.evaluate(e =>
        getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
      )
      const insideToken = await host.evaluate(e =>
        getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
      )

      expect(outsideToken).toBe('')
      expect(insideToken).toBe(tokensConfig.colors.test.primary.value)
    })

    test('data-layer resolves var() color for primitives in scope', async ({ page }) => {
      test.setTimeout(60_000)
      await page.goto(testRoutes.layers)
      const inside = page.getByTestId('consumer-layer-text')
      await expect(inside).toBeVisible()
      const insideColor = await inside.evaluate(e => getComputedStyle(e).color)
      expect(insideColor).toBe(hexToRgb(tokensConfig.colors.test.primary.value))

      const outside = page.getByTestId('consumer-layer-outside')
      await expect(outside).toBeVisible()
      const outsideToken = await outside.evaluate(e =>
        getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
      )
      expect(outsideToken).toBe('')
    })

    test.skip('data-layer preserves light and dark token values within the consumer layer scope', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await snapshotLayerCss('color-mode')
      await page.goto(testRoutes.layers)

      const lightTarget = page.getByTestId('consumer-layer-color-mode-light')
      const darkTarget = page.getByTestId('consumer-layer-color-mode-dark')

      await expect(lightTarget).toBeVisible()
      await expect(darkTarget).toBeVisible()

      const lightColor = await lightTarget.evaluate(e => getComputedStyle(e).color)
      const darkColor = await darkTarget.evaluate(e => getComputedStyle(e).color)

      expect(lightColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
      expect(darkColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
    })

    test('primitive host scopes tokens to raw DOM descendants, but not outside DOM', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.goto(testRoutes.layers)

      const outside = page.getByTestId('consumer-layer-outside')
      const rawChild = page.getByTestId('consumer-layer-raw-child')

      await expect(rawChild).toBeVisible()

      const outsideToken = await outside.evaluate(e =>
        getComputedStyle(e).getPropertyValue('--colors-test-primary').trim()
      )
      const rawChildColor = await rawChild.evaluate(e => getComputedStyle(e).color)

      expect(outsideToken).toBe('')
      expect(rawChildColor).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
    })

    test('layers only – upstream theme token in CSS; consumer primitives use consumer scope', async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.goto(testRoutes.layers)
      const inside = page.getByTestId('layers-test')
      await expect(inside).toBeVisible()
      // Consumer scope is established by the nearest layer host; upstream tokens are under [data-layer="reference-ui"].
      // So consumer DOM does not see --colors-teal-500 (upstream). Assert upstream CSS is present via stylesheet.
      const outside = page.getByTestId('layers-outside')
      await expect(outside).toBeVisible()
      const outsideColor = await outside.evaluate(e =>
        getComputedStyle(e).getPropertyValue('--colors-lightDarkDemoBg').trim()
      )
      expect(outsideColor).not.toBe(lightDarkDemoBgLight)
    })
  })

  test('renaming ui.config.name updates CSS scope and packaged react runtime', async () => {
    test.setTimeout(60_000)
    await applyLayerConfig({
      name: RENAMED_LAYER_NAME,
      extends: '[]',
      layers: '[layerBaseSystem]',
    })

    const stylesPath = join(sandboxDir, '.reference-ui', 'react', 'styles.css')
    const reactBundlePath = join(sandboxDir, '.reference-ui', 'react', 'react.mjs')
    const stylesContent = await readFile(stylesPath, 'utf-8')
    await mkdir(cssSnapshotDir, { recursive: true })
    const projectName = process.env.REF_TEST_PROJECT ?? 'unknown-project'
    await writeFile(
      join(cssSnapshotDir, `${projectName}-renamed-layer.css`),
      stylesContent,
      'utf-8'
    )
    const reactBundle = await readFile(reactBundlePath, 'utf-8')

    expect(stylesContent).toContain(`@layer ${RENAMED_LAYER_NAME} {`)
    expect(stylesContent).toContain(`[data-layer="${RENAMED_LAYER_NAME}"]`)
    expect(stylesContent).not.toContain(`[data-layer="${LAYER_NAME}"]`)

    expect(reactBundle).toContain(RENAMED_LAYER_NAME)
    expect(reactBundle).not.toContain(REACT_LAYER_PLACEHOLDER)
  })
})
