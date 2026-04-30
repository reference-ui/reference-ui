import { expect, test, type Page } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  watchConfigImportedTokenValue,
  watchConfigImportedTokenVariable,
} from '../../src/watch-config-base-system'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..', '..')
const sessionPath = join(packageRoot, '.reference-ui', 'tmp', 'session.json')
const styledStylesPath = join(packageRoot, '.reference-ui', 'styled', 'styles.css')
const reactStylesPath = join(packageRoot, '.reference-ui', 'react', 'styles.css')
const virtualRecipeFilePath = join(packageRoot, '.reference-ui', 'virtual', 'src', 'watch', 'recipe.ts')
const cssFilePath = join(packageRoot, 'src', 'watch', 'css.ts')
const primitiveFilePath = join(packageRoot, 'src', 'watch', 'primitive.ts')
const recipeFilePath = join(packageRoot, 'src', 'watch', 'recipe.ts')
const tokensFilePath = join(packageRoot, 'src', 'watch', 'tokens.ts')
const configBaseSystemFilePath = join(packageRoot, 'src', 'watch-config-base-system.ts')

function randomHexColor(excluded: ReadonlySet<string>): string {
  while (true) {
    const color = `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`

    if (!excluded.has(color)) {
      return color
    }
  }
}

function hexToRgb(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  return `rgb(${Number.parseInt(match[1], 16)}, ${Number.parseInt(match[2], 16)}, ${Number.parseInt(match[3], 16)})`
}

function normalizeColorValue(value: string): string {
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, ' ')
  const oklchMatch = trimmed.match(/^oklch\(([^%]+)% ([^ ]+) ([^)]+)\)$/)

  if (!oklchMatch) {
    return trimmed
  }

  const lightness = (Number.parseFloat(oklchMatch[1]) / 100).toString()
  return `oklch(${lightness} ${oklchMatch[2]} ${oklchMatch[3]})`
}

function buildCssSlice(color: string): string {
  return [
    "import { css } from '@reference-ui/react'",
    '',
    'export const watchCssClass = css({',
    `  color: '${color}',`,
    "  fontWeight: '700',",
    '})',
    '',
  ].join('\n')
}

function buildPrimitiveSlice(color: string): string {
  return [`export const watchPrimitiveColor = '${color}'`, ''].join('\n')
}

function buildRecipeSlice(color: string): string {
  return [
    "import { recipe } from '@reference-ui/react'",
    '',
    'export const watchRecipe = recipe({',
    '  base: {',
    "    color: 'white',",
    "    padding: '16px',",
    "    borderRadius: '12px',",
    '  },',
    '  variants: {',
    '    tone: {',
    '      solid: {',
    `        backgroundColor: '${color}',`,
    '      },',
    '    },',
    '  },',
    '})',
    '',
  ].join('\n')
}

function buildTokensSlice(color: string): string {
  return [
    "import { tokens } from '@reference-ui/system'",
    '',
    'tokens({',
    '  colors: {',
    "    'watch-sync': {",
    `      primary: { value: '${color}' },`,
    '    },',
    '  },',
    '})',
    '',
  ].join('\n')
}

function readSessionSnapshot(): { buildState: string | null; source: string; updatedAt: string | null } | null {
  if (!existsSync(sessionPath)) {
    return null
  }

  try {
    const source = readFileSync(sessionPath, 'utf-8')
    const session = JSON.parse(source) as {
      buildState?: string
      updatedAt?: string
    }

    return {
      buildState: typeof session.buildState === 'string' ? session.buildState : null,
      source,
      updatedAt: typeof session.updatedAt === 'string' ? session.updatedAt : null,
    }
  } catch {
    return null
  }
}

function getReadyMarker(): string | null {
  const snapshot = readSessionSnapshot()

  if (!snapshot || snapshot.buildState !== 'ready') {
    return null
  }

  return snapshot.updatedAt
}

async function waitForNextWatchReady(timeoutMs = 60_000, baselineMarker = getReadyMarker()): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const snapshot = readSessionSnapshot()

    if (snapshot?.buildState === 'failed') {
      throw new Error(`ref sync watch failed before reaching ready\n${snapshot.source}`)
    }

    const nextMarker = snapshot?.buildState === 'ready' ? snapshot.updatedAt : null

    if (nextMarker && nextMarker !== baselineMarker) {
      return
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
  }

  throw new Error(`Timed out waiting for a fresh watch-ready marker at ${sessionPath}`)
}

function expectFileToContain(filePath: string, value: string, label: string): void {
  const source = readFileSync(filePath, 'utf-8').toLowerCase()
  expect(source.includes(value.toLowerCase()), label).toBe(true)
}

function readCssVariableValue(filePath: string, variableName: string): string {
  const source = readFileSync(filePath, 'utf-8')
  const escapedVariableName = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`${escapedVariableName}:\\s*([^;]+);`))

  if (!match) {
    throw new Error(`Could not find ${variableName} in ${filePath}`)
  }

  return match[1].trim()
}

async function reloadWatchApp(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('watch-root')).toBeVisible({ timeout: 60_000 })
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const shouldRetry =
        message.includes('ERR_ABORTED')
        || message.includes('frame was detached')
        || message.includes('interrupted by another navigation')

      if (!shouldRetry || attempt === 7) {
        throw error
      }
    }
  }
}

async function readComputedStyleWithRetry(
  page: Page,
  testId: string,
  property: 'backgroundColor' | 'color',
): Promise<string> {
  const locator = page.getByTestId(testId)

  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      await locator.waitFor({ state: 'visible', timeout: 15_000 })
      return await locator.evaluate((element, styleProperty) => {
        const style = getComputedStyle(element)
        return styleProperty === 'backgroundColor' ? style.backgroundColor : style.color
      }, property)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const shouldRetry =
        message.includes('Execution context was destroyed')
        || message.includes('Target closed')
        || message.includes('Cannot find context')

      if (!shouldRetry || attempt === 11) {
        throw error
      }

      await page.waitForLoadState('domcontentloaded').catch(() => {})
    }
  }

  throw new Error(`Unable to read computed style for ${testId}`)
}

async function expectComputedStyle(
  page: Page,
  testId: string,
  property: 'backgroundColor' | 'color',
  expectedValue: string,
): Promise<void> {
  await expect
    .poll(
      async () => normalizeColorValue(await readComputedStyleWithRetry(page, testId, property)),
      { timeout: 60_000 },
    )
    .toBe(normalizeColorValue(expectedValue))
}

test.describe('watch contract', () => {
  test('ref sync --watch stays aligned across css, primitive, recipe, and token edits', async ({ page }) => {
    test.setTimeout(180_000)

    const [originalCss, originalPrimitive, originalRecipe, originalTokens] = await Promise.all([
      readFile(cssFilePath, 'utf-8'),
      readFile(primitiveFilePath, 'utf-8'),
      readFile(recipeFilePath, 'utf-8'),
      readFile(tokensFilePath, 'utf-8'),
    ])

    const cssColor = randomHexColor(new Set())
    const primitiveColor = 'blue.600'
    const recipeColor = 'teal.600'
    const tokenColor = randomHexColor(new Set([cssColor]))

    try {
      await page.goto('/')
      await expect(page.getByTestId('watch-root')).toBeVisible({ timeout: 60_000 })

      const cssBaseline = getReadyMarker()
      await writeFile(cssFilePath, buildCssSlice(cssColor))
      await waitForNextWatchReady(60_000, cssBaseline)
      await reloadWatchApp(page)

      expectFileToContain(styledStylesPath, cssColor, 'styled/styles.css should contain the watched css() color at the ready edge')
      expectFileToContain(reactStylesPath, cssColor, 'react/styles.css should contain the watched css() color at the ready edge')
      await expectComputedStyle(page, 'watch-css', 'color', hexToRgb(cssColor))

      const primitiveBaseline = getReadyMarker()
      await writeFile(primitiveFilePath, buildPrimitiveSlice(primitiveColor))
      await waitForNextWatchReady(60_000, primitiveBaseline)
      await reloadWatchApp(page)

      await expectComputedStyle(
        page,
        'watch-primitive',
        'color',
        readCssVariableValue(reactStylesPath, '--colors-blue-600'),
      )

      const comboBaseline = getReadyMarker()
      await Promise.all([
        writeFile(recipeFilePath, buildRecipeSlice(recipeColor)),
        writeFile(tokensFilePath, buildTokensSlice(tokenColor)),
      ])
      await waitForNextWatchReady(60_000, comboBaseline)
      await reloadWatchApp(page)

      expectFileToContain(virtualRecipeFilePath, recipeColor, 'virtual recipe source should contain the updated recipe color at the ready edge')
      expectFileToContain(reactStylesPath, tokenColor, 'react/styles.css should contain the updated token color at the ready edge')
      await expectComputedStyle(page, 'watch-token', 'color', hexToRgb(tokenColor))
    } finally {
      const restoreBaseline = getReadyMarker()
      await Promise.all([
        writeFile(cssFilePath, originalCss),
        writeFile(primitiveFilePath, originalPrimitive),
        writeFile(recipeFilePath, originalRecipe),
        writeFile(tokensFilePath, originalTokens),
      ])

      await waitForNextWatchReady(60_000, restoreBaseline).catch(() => {})
    }
  })

  test('ref sync --watch refreshes token output when an imported ui.config dependency changes', async ({ page }) => {
    test.setTimeout(180_000)

    const originalConfigBaseSystemSource = await readFile(configBaseSystemFilePath, 'utf-8')
    const updatedTokenValue = randomHexColor(new Set([watchConfigImportedTokenValue]))
    const updatedConfigBaseSystemSource = originalConfigBaseSystemSource.replace(
      watchConfigImportedTokenValue,
      updatedTokenValue,
    )

    expect(updatedConfigBaseSystemSource).not.toBe(originalConfigBaseSystemSource)

    try {
      await page.goto('/')
      await expect(page.getByTestId('watch-root')).toBeVisible({ timeout: 60_000 })
      await expectComputedStyle(page, 'watch-config-token', 'color', hexToRgb(watchConfigImportedTokenValue))

      const baselineMarker = getReadyMarker()
      await writeFile(configBaseSystemFilePath, updatedConfigBaseSystemSource)
      await waitForNextWatchReady(60_000, baselineMarker)
      await reloadWatchApp(page)

      expectFileToContain(
        reactStylesPath,
        watchConfigImportedTokenVariable,
        'react/styles.css should keep the imported config token variable after a config dependency edit',
      )
      expectFileToContain(
        reactStylesPath,
        updatedTokenValue,
        'react/styles.css should contain the imported config token value after a config dependency edit',
      )
      await expectComputedStyle(page, 'watch-config-token', 'color', hexToRgb(updatedTokenValue))
    } finally {
      const restoreBaseline = getReadyMarker()
      await writeFile(configBaseSystemFilePath, originalConfigBaseSystemSource)
      await waitForNextWatchReady(60_000, restoreBaseline).catch(() => {})
    }
  })
})