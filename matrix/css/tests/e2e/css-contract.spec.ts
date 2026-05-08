import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { cssMatrixConstants } from '../../src/constants'
import { matrixCssMarker } from '../../src/index'
import { cssMatrixClasses } from '../../src/styles'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..', '..')
const stylesSourcePath = join(packageRoot, 'src', 'styles.ts')

async function readComputedStyle(
  locator: Locator,
  properties: readonly string[],
): Promise<Record<string, string>> {
  return locator.evaluate((node: Element, requestedProperties: readonly string[]) => {
    const style = getComputedStyle(node)

    const toCamelCase = (property: string) => property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())

    return Object.fromEntries(
      requestedProperties.map((property) => {
        const camelProperty = toCamelCase(property) as keyof CSSStyleDeclaration
        const value = style[camelProperty]
        return [property, typeof value === 'string' ? value : style.getPropertyValue(property)]
      }),
    )
  }, properties)
}

function normalizeColorValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function expectColorValue(actual: string, expected: string): void {
  const normalizedActual = normalizeColorValue(actual)
  const normalizedExpected = normalizeColorValue(expected)

  expect(normalizedActual).toBe(normalizedExpected)
}

async function gotoAtViewport(
  page: Page,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport)
  await page.goto('/')
}

function runRefSync(): void {
  try {
    execFileSync('pnpm', ['exec', 'ref', 'sync'], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    })
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
    )
  }
}

async function reloadCssApp(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('css-root')).toBeVisible({ timeout: 15_000 })
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

async function readMountedStylesheetSummary(
  page: Page,
  values: { originalBorderRadius: string; replacementBorderRadius: string },
): Promise<{
  styleTagCount: number
  layerOrderCount: number
  originalBorderRadiusCount: number
  replacementBorderRadiusCount: number
}> {
  return page.evaluate(({ originalBorderRadius, replacementBorderRadius }) => {
    const styleTexts = Array.from(document.querySelectorAll('style')).map((element) => element.textContent ?? '')
    const joined = styleTexts.join('\n')
    const countMatches = (pattern: string) => [...joined.matchAll(new RegExp(pattern, 'g'))].length

    return {
      styleTagCount: styleTexts.length,
      layerOrderCount: styleTexts.filter((text) =>
        text.includes('@layer reset, global, base, tokens, recipes, utilities;')).length,
      originalBorderRadiusCount: countMatches(`border-radius\\s*:\\s*${originalBorderRadius}`),
      replacementBorderRadiusCount: countMatches(`border-radius\\s*:\\s*${replacementBorderRadius}`),
    }
  }, values)
}

test.describe('css contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the css fixture root', async ({ page }) => {
    expect(matrixCssMarker).toBe('reference-ui-matrix-css')
    await expect(page.getByTestId('css-root')).toBeVisible()
  })

  test('renders the css fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI css matrix' })).toBeVisible()
  })

  test('exports the card class at runtime', async () => {
    expect(cssMatrixClasses.card).toBeTruthy()
  })

  test('css() applies card padding', async ({ page }) => {
    const card = page.getByTestId('css-card')
    const computed = await readComputedStyle(card, ['padding-top'])

    expect(computed['padding-top']).toBe('16px')
  })

  test('css() applies card border radius', async ({ page }) => {
    const card = page.getByTestId('css-card')
    const computed = await readComputedStyle(card, ['border-radius'])

    expect(computed['border-radius']).toBe('12px')
  })

  test('css() applies card border width', async ({ page }) => {
    const card = page.getByTestId('css-card')
    const computed = await readComputedStyle(card, ['border-top-width'])

    expect(computed['border-top-width']).toBe('2px')
  })

  test('css() applies card border style', async ({ page }) => {
    const card = page.getByTestId('css-card')
    const computed = await readComputedStyle(card, ['border-top-style'])

    expect(computed['border-top-style']).toBe('solid')
  })

  test('css() keeps the non-card attribute branch on the baseline border width before hover', async ({ page }) => {
    const element = page.getByTestId('css-component-panel')
    const computed = await readComputedStyle(element, ['border-top-width'])

    expect(computed['border-top-width']).toBe(cssMatrixConstants.componentHoverBaseBorderTopWidth)
  })

  test.fixme('css() applies the [data-component=card]:hover selector for the matching element', async ({ page }) => {
    const element = page.getByTestId('css-component-card')

    await element.hover()

    const computed = await readComputedStyle(element, ['border-top-width'])

    expect(computed['border-top-width']).toBe(cssMatrixConstants.componentHoverActiveBorderTopWidth)
  })

  test('css() keeps the non-matching attribute branch on the baseline border width when hovered', async ({ page }) => {
    const element = page.getByTestId('css-component-panel')

    await element.hover()

    const computed = await readComputedStyle(element, ['border-top-width'])

    expect(computed['border-top-width']).toBe(cssMatrixConstants.componentHoverBaseBorderTopWidth)
  })

  test('css() keeps hoverable text undecorated before hover', async ({ page }) => {
    const element = page.getByTestId('css-hoverable')
    const computed = await readComputedStyle(element, ['text-decoration-line'])

    expect(computed['text-decoration-line']).toBe('none')
  })

  test('css() applies hover pseudo styles on hover', async ({ page }) => {
    const element = page.getByTestId('css-hoverable')
    await element.hover()
    const computed = await readComputedStyle(element, ['text-decoration-line'])

    expect(computed['text-decoration-line']).toContain('underline')
  })

  test('css() applies positioned layout mode', async ({ page }) => {
    const element = page.getByTestId('css-positioned')
    const computed = await readComputedStyle(element, ['position'])

    expect(computed.position).toBe('relative')
  })

  test('css() applies positioned top offset', async ({ page }) => {
    const element = page.getByTestId('css-positioned')
    const computed = await readComputedStyle(element, ['top'])

    expect(computed.top).toBe('4px')
  })

  test('css() applies positioned left offset', async ({ page }) => {
    const element = page.getByTestId('css-positioned')
    const computed = await readComputedStyle(element, ['left'])

    expect(computed.left).toBe('8px')
  })

  test('css() applies positioned padding', async ({ page }) => {
    const element = page.getByTestId('css-positioned')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('8px')
  })

  test('css() applies nested descendant margin', async ({ page }) => {
    const element = page.getByTestId('css-nested-child')
    const computed = await readComputedStyle(element, ['margin-top'])

    expect(computed['margin-top']).toBe('12px')
  })

  test('css() keeps closed state border width on the baseline branch', async ({ page }) => {
    const element = page.getByTestId('css-state-closed')
    const computed = await readComputedStyle(element, ['border-top-width'])

    expect(computed['border-top-width']).toBe('1px')
  })

  test('css() lowers named container query padding for the narrow shell', async ({ page }) => {
    const narrowProbe = page.getByTestId('css-container-probe-narrow')
    const narrowStyles = await readComputedStyle(narrowProbe, ['padding-top'])

    expect(narrowStyles['padding-top']).toBe('4px')
  })

  test('css() lowers named container query font size for the narrow shell', async ({ page }) => {
    const narrowProbe = page.getByTestId('css-container-probe-narrow')
    const narrowStyles = await readComputedStyle(narrowProbe, ['font-size'])

    expect(narrowStyles['font-size']).toBe('16px')
  })

  test('css() lowers named container query padding for the wide shell', async ({ page }) => {
    const wideProbe = page.getByTestId('css-container-probe-wide')
    const wideStyles = await readComputedStyle(wideProbe, ['padding-top'])

    expect(wideStyles['padding-top']).toBe('16px')
  })

  test('css() lowers named container query font size for the wide shell', async ({ page }) => {
    const wideProbe = page.getByTestId('css-container-probe-wide')
    const wideStyles = await readComputedStyle(wideProbe, ['font-size'])

    expect(wideStyles['font-size']).toBe('18px')
  })

  test('css() keeps the viewport media-query probe on its base branch below the viewport threshold', async ({ page }) => {
    await gotoAtViewport(page, {
      width: cssMatrixConstants.viewportBreakpointWidth - 80,
      height: 900,
    })

    const probe = page.getByTestId('css-viewport-probe')
    const computed = await readComputedStyle(probe, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('css() applies the viewport media-query branch above the viewport threshold', async ({ page }) => {
    await gotoAtViewport(page, {
      width: cssMatrixConstants.viewportBreakpointWidth + 120,
      height: 900,
    })

    const probe = page.getByTestId('css-viewport-probe')
    const computed = await readComputedStyle(probe, ['padding-top', 'background-color', 'color'])

    expect(computed['padding-top']).toBe(cssMatrixConstants.viewportProbePadding)
    expectColorValue(computed['background-color'], cssMatrixConstants.viewportProbeBackground)
    expectColorValue(computed.color, cssMatrixConstants.viewportProbeForeground)
  })

  test('generated stylesheets mount in the document', async ({ page }) => {
    const styleTagCount = await page.evaluate(() => document.querySelectorAll('style').length)

    expect(styleTagCount).toBeGreaterThan(0)
  })

  test('generated stylesheets include the global layer ordering declaration', async ({ page }) => {
    const hasLayerOrder = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        return (element.textContent ?? '').includes('@layer reset, global, base, tokens, recipes, utilities;')
      })
    })

    expect(hasLayerOrder).toBe(true)
  })

  test('generated stylesheets include the mounted utility layer block', async ({ page }) => {
    const hasLayerBlock = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        const text = element.textContent ?? ''
        return text.includes('@layer utilities{') || text.includes('@layer utilities {')
      })
    })

    expect(hasLayerBlock).toBe(true)
  })

  test('generated stylesheets include authored css() declarations', async ({ page }) => {
    const hasDeclaration = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        const text = element.textContent ?? ''
        return text.includes('text-decoration') && text.includes('border-radius')
      })
    })

    expect(hasDeclaration).toBe(true)
  })

  test('rebuild keeps stylesheet presence and order stable while replacing stale css() declarations in the browser', async ({ page }) => {
    test.setTimeout(120_000)

    const originalSource = readFileSync(stylesSourcePath, 'utf-8')
    const originalCardSource = [
      'export const cardClass = css({',
      "  padding: '1rem',",
      "  borderRadius: '12px',",
      "  borderWidth: '2px',",
      "  borderStyle: 'solid',",
      '})',
    ].join('\n')
    const replacementBorderRadius = '23px'
    const replacementCardSource = [
      'export const cardClass = css({',
      "  padding: '1rem',",
      `  borderRadius: '${replacementBorderRadius}',`,
      "  borderWidth: '2px',",
      "  borderStyle: 'solid',",
      '})',
    ].join('\n')
    const updatedSource = originalSource.replace(originalCardSource, replacementCardSource)
    const initialSummary = await readMountedStylesheetSummary(page, {
      originalBorderRadius: '12px',
      replacementBorderRadius,
    })

    expect(originalSource).toContain(originalCardSource)
    expect(updatedSource).not.toBe(originalSource)
    expect(initialSummary.styleTagCount).toBeGreaterThan(0)
    expect(initialSummary.layerOrderCount).toBeGreaterThan(0)
    expect(initialSummary.originalBorderRadiusCount).toBe(1)
    expect(initialSummary.replacementBorderRadiusCount).toBe(0)

    try {
      writeFileSync(stylesSourcePath, updatedSource)
      runRefSync()

      await expect
        .poll(
          async () => {
            await reloadCssApp(page)

            const computed = await readComputedStyle(page.getByTestId('css-card'), ['border-radius'])
            const summary = await readMountedStylesheetSummary(page, {
              originalBorderRadius: '12px',
              replacementBorderRadius,
            })

            return {
              borderRadius: computed['border-radius'],
              styleTagCount: summary.styleTagCount,
              layerOrderCount: summary.layerOrderCount,
              originalBorderRadiusCount: summary.originalBorderRadiusCount,
              replacementBorderRadiusCount: summary.replacementBorderRadiusCount,
            }
          },
          { timeout: 60_000 },
        )
        .toEqual({
          borderRadius: replacementBorderRadius,
          styleTagCount: initialSummary.styleTagCount,
          layerOrderCount: initialSummary.layerOrderCount,
          originalBorderRadiusCount: 0,
          replacementBorderRadiusCount: 1,
        })
    } finally {
      writeFileSync(stylesSourcePath, originalSource)
      runRefSync()
    }
  })
})