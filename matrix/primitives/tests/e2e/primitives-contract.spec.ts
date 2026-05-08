import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { Div } from '@reference-ui/react'

import { primitiveMatrixColors } from '../../src/colors'
import { matrixPrimitivesMarker } from '../../src/index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..', '..')
const primitiveCssPropFixtureSourcePath = join(packageRoot, 'src', 'primitiveCssPropFixture.ts')

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
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, ' ')
  const oklchPercentMatch = trimmed.match(/^oklch\(([^%]+)% ([^ ]+) ([^)]+)\)$/)

  if (oklchPercentMatch) {
    return `oklch(${[oklchPercentMatch[1], oklchPercentMatch[2], oklchPercentMatch[3]].map((part, index) => {
      if (index === 0) {
        return (Number.parseFloat(part) / 100).toString()
      }

      return Number.parseFloat(part).toString()
    }).join(' ')})`
  }

  const oklchMatch = trimmed.match(/^oklch\(([^ ]+) ([^ ]+) ([^)]+)\)$/)

  if (!oklchMatch) {
    return trimmed
  }

  return `oklch(${[oklchMatch[1], oklchMatch[2], oklchMatch[3]].map((part) => Number.parseFloat(part).toString()).join(' ')})`
}

function parseOklchValue(value: string): [number, number, number] | null {
  const normalized = normalizeColorValue(value)
  const match = normalized.match(/^oklch\(([^ ]+) ([^ ]+) ([^)]+)\)$/)

  if (!match) {
    return null
  }

  return [Number.parseFloat(match[1]), Number.parseFloat(match[2]), Number.parseFloat(match[3])]
}

function expectColorValue(actual: string, expected: string): void {
  const actualOklch = parseOklchValue(actual)
  const expectedOklch = parseOklchValue(expected)

  if (!actualOklch || !expectedOklch) {
    expect(normalizeColorValue(actual)).toBe(normalizeColorValue(expected))
    return
  }

  expect(actualOklch[0]).toBeCloseTo(expectedOklch[0], 3)
  expect(actualOklch[1]).toBeCloseTo(expectedOklch[1], 3)
  expect(actualOklch[2]).toBeCloseTo(expectedOklch[2], 3)
}

async function readCssVariable(locator: Locator, name: string): Promise<string> {
  return locator.evaluate((node: Element, variableName: string) => {
    return getComputedStyle(node).getPropertyValue(variableName).trim()
  }, name)
}

function expectFontFamilyIncludes(fontFamily: string, fragment: string): void {
  expect(fontFamily.toLowerCase()).toContain(fragment.toLowerCase())
}

function hexToRgb(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  return `rgb(${Number.parseInt(match[1], 16)}, ${Number.parseInt(match[2], 16)}, ${Number.parseInt(match[3], 16)})`
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

async function reloadPrimitivesApp(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('primitives-root')).toBeVisible({ timeout: 15_000 })
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

test.describe('primitives contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the primitives fixture root', async ({ page }) => {
    expect(Div).toBeTruthy()
    expect(matrixPrimitivesMarker).toBe('reference-ui-matrix-primitives')

    await expect(page.getByTestId('primitives-root')).toBeVisible()
  })

  test('renders the primitives fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI Primitives matrix' })).toBeVisible()
  })

  test('renders the primitives fixture description', async ({ page }) => {
    await expect(page.getByText('Primitive mounting and style props are exercised against emitted design-system CSS.')).toBeVisible()
  })

  test('primitive base render keeps native div semantics and layer identity', async ({ page }) => {
    const element = page.getByTestId('primitive-basic')

    await expect(element).toBeVisible()
    await expect(element).toContainText('Basic primitive')
    await expect(element).toHaveAttribute('data-layer', 'primitives')

    const tagName = await element.evaluate((node: Element) => node.tagName)

    expect(tagName).toBe('DIV')
  })

  test('ui.config.jsxElements styles one local custom JSX consumer', async ({ page }) => {
    const element = page.getByTestId('primitive-jsx-element')

    await expect(element).toBeVisible()
    await expect(element).toContainText('Local custom JSX element styled via ui.config.jsxElements')
  })

  test('ui.config.jsxElements resolves style props on the local custom JSX consumer', async ({ page }) => {
    const element = page.getByTestId('primitive-jsx-element')
    const expectedSurfaceWarning = await readCssVariable(element, primitiveMatrixColors.surfaceWarningCssVariable)
    const expectedTextDanger = await readCssVariable(element, primitiveMatrixColors.textDangerCssVariable)
    const computed = await readComputedStyle(element, ['background-color', 'color', 'padding-top', 'border-radius'])

    expectColorValue(computed['background-color'], expectedSurfaceWarning)
    expectColorValue(computed.color, expectedTextDanger)
    expect(computed['padding-top']).toBe('12px')
    expect(computed['border-radius']).toBe('999px')
  })

  test('primitive style props apply text color', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const expectedTextDanger = await readCssVariable(element, primitiveMatrixColors.textDangerCssVariable)
    const computed = await readComputedStyle(element, ['color'])

    expectColorValue(computed.color, expectedTextDanger)
  })

  test('primitive style props apply background color', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const expectedSurfaceWarning = await readCssVariable(element, primitiveMatrixColors.surfaceWarningCssVariable)
    const computed = await readComputedStyle(element, ['background-color'])

    expectColorValue(computed['background-color'], expectedSurfaceWarning)
  })

  test('primitive style props apply padding', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('16px')
  })

  test('primitive style props apply border width', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['border-width'])

    expect(computed['border-width']).toBe('2px')
  })

  test('primitive style props apply border style', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['border-style'])

    expect(computed['border-style']).toBe('solid')
  })

  test('primitive style props apply border color', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const expectedBorderStrong = await readCssVariable(element, primitiveMatrixColors.borderStrongCssVariable)
    const computed = await readComputedStyle(element, ['border-color'])

    expectColorValue(computed['border-color'], expectedBorderStrong)
  })

  test('primitive style props apply border radius', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('12px')
  })

  test('inline border primitive applies border width', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-width'])

    expect(inlineStyles['border-width']).toBe('3px')
  })

  test('inline border primitive applies border style', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-style'])

    expect(inlineStyles['border-style']).toBe('solid')
  })

  test('inline border primitive applies border color', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const expectedBorderSuccess = await readCssVariable(inlineBorder, primitiveMatrixColors.borderSuccessCssVariable)
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-color'])

    expectColorValue(inlineStyles['border-color'], expectedBorderSuccess)
  })

  test('inline border primitive applies border radius', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-radius'])

    expect(inlineStyles['border-radius']).toBe('8px')
  })

  test('inline color primitive applies direct hex text color', async ({ page }) => {
    const element = page.getByTestId('primitive-inline-color')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb('#dc2626'))
  })

  test('inline color primitive applies direct hex background color', async ({ page }) => {
    const element = page.getByTestId('primitive-inline-color')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb('#fef3c7'))
  })

  test('inline color primitive preserves authored padding', async ({ page }) => {
    const element = page.getByTestId('primitive-inline-color')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('12px')
  })

  test('border shorthand primitive expands shorthand hex to the rendered border color', async ({ page }) => {
    const element = page.getByTestId('primitive-border-shorthand-hex')
    const computed = await readComputedStyle(element, ['border-width', 'border-style', 'border-color'])

    expect(computed['border-width']).toBe('1px')
    expect(computed['border-style']).toBe('solid')
    expect(computed['border-color']).toBe(hexToRgb('#112233'))
  })

  test('mixed primitive keeps token background alongside inline border values', async ({ page }) => {
    const element = page.getByTestId('primitive-mixed-values')
    const expectedSurfaceWarning = await readCssVariable(element, primitiveMatrixColors.surfaceWarningCssVariable)
    const computed = await readComputedStyle(element, ['background-color', 'border-width', 'border-color', 'border-radius', 'padding-top'])

    expectColorValue(computed['background-color'], expectedSurfaceWarning)
    expect(computed['border-width']).toBe('2px')
    expect(computed['border-color']).toBe(hexToRgb('#7c3aed'))
    expect(computed['border-radius']).toBe('12px')
    expect(computed['padding-top']).toBe('8px')
  })

  test('layout primitive covers display and overflow prop families in the browser', async ({ page }) => {
    const element = page.getByTestId('primitive-layout-props')
    const computed = await readComputedStyle(element, ['display', 'max-width', 'overflow', 'white-space'])

    expect(computed.display).toBe('inline-block')
    expect(computed['max-width']).toBe('320px')
    expect(computed.overflow).toBe('hidden')
    expect(computed['white-space']).toBe('nowrap')
  })

  test('primitive css prop does not leak to the DOM', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    await expect(element).not.toHaveAttribute('css', /.*/)
  })

  test('primitive css prop composes a reference-ui class', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const className = await element.getAttribute('class')

    expect(className).toContain('ref-div')
  })

  test('primitive css prop does not stringify object values into class names', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const className = await element.getAttribute('class')

    expect(className).not.toContain('[object Object]')
  })

  test('primitive css prop applies relative positioning', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const computed = await readComputedStyle(element, ['position'])

    expect(computed.position).toBe('relative')
  })

  test('primitive css prop preserves padding', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('8px')
  })

  test('font preset resolves sans font family', async ({ page }) => {
    const sansDefault = page.getByTestId('primitive-font-sans')
    const defaultStyles = await readComputedStyle(sansDefault, ['font-family'])

    expectFontFamilyIncludes(defaultStyles['font-family'], 'Inter')
  })

  test('font preset resolves regular weight', async ({ page }) => {
    const sansDefault = page.getByTestId('primitive-font-sans')
    const defaultStyles = await readComputedStyle(sansDefault, ['font-weight'])

    expect(defaultStyles['font-weight']).toBe('400')
  })

  test('font preset resolves negative letter spacing', async ({ page }) => {
    const sansDefault = page.getByTestId('primitive-font-sans')
    const defaultStyles = await readComputedStyle(sansDefault, ['letter-spacing'])

    expect(Number.parseFloat(defaultStyles['letter-spacing'])).toBeLessThan(0)
  })

  test('font preset keeps sans family under bold weight', async ({ page }) => {
    const sansBold = page.getByTestId('primitive-font-bold')
    const boldStyles = await readComputedStyle(sansBold, ['font-family'])

    expectFontFamilyIncludes(boldStyles['font-family'], 'Inter')
  })

  test('font preset resolves explicit bold weight', async ({ page }) => {
    const sansBold = page.getByTestId('primitive-font-bold')
    const boldStyles = await readComputedStyle(sansBold, ['font-weight'])

    expect(boldStyles['font-weight']).toBe('700')
  })

  test('font preset resolves token bold weight', async ({ page }) => {
    const sansBoldToken = page.getByTestId('primitive-font-token')
    const boldTokenStyles = await readComputedStyle(sansBoldToken, ['font-weight'])

    expect(boldTokenStyles['font-weight']).toBe('700')
  })

  test('anonymous container enables inline-size containment', async ({ page }) => {
    const anonymousContainer = page.getByTestId('primitive-container-anon')
    const anonymousStyles = await readComputedStyle(anonymousContainer, ['container-type'])

    expect(anonymousStyles['container-type']).toBe('inline-size')
  })

  test('named container enables inline-size containment', async ({ page }) => {
    const namedContainer = page.getByTestId('primitive-container-named')
    const namedStyles = await readComputedStyle(namedContainer, ['container-type'])

    expect(namedStyles['container-type']).toBe('inline-size')
  })

  test('named container exposes the authored container name', async ({ page }) => {
    const namedContainer = page.getByTestId('primitive-container-named')
    const namedStyles = await readComputedStyle(namedContainer, ['container-name'])

    expect(namedStyles['container-name']).toBe('sidebar')
  })

  test('responsive primitive stays narrow below the container threshold for padding', async ({ page }) => {
    const narrowResponsive = page.getByTestId('primitive-responsive-narrow')
    const narrowStyles = await readComputedStyle(narrowResponsive, ['padding-top'])

    expect(narrowStyles['padding-top']).toBe('4px')
  })

  test('responsive primitive stays narrow below the container threshold for font size', async ({ page }) => {
    const narrowResponsive = page.getByTestId('primitive-responsive-narrow')
    const narrowStyles = await readComputedStyle(narrowResponsive, ['font-size'])

    expect(narrowStyles['font-size']).toBe('16px')
  })

  test('responsive primitive expands above the container threshold for padding', async ({ page }) => {
    const wideResponsive = page.getByTestId('primitive-responsive-wide')
    const wideStyles = await readComputedStyle(wideResponsive, ['padding-top'])

    expect(wideStyles['padding-top']).toBe('16px')
  })

  test('responsive primitive expands above the container threshold for font size', async ({ page }) => {
    const wideResponsive = page.getByTestId('primitive-responsive-wide')
    const wideStyles = await readComputedStyle(wideResponsive, ['font-size'])

    expect(wideStyles['font-size']).toBe('18px')
  })

  test('size prop emits a width utility class', async ({ page }) => {
    const element = page.getByTestId('primitive-size-square')
    const className = await element.getAttribute('class')

    expect(className).toContain('w_')
  })

  test('size prop emits a height utility class', async ({ page }) => {
    const element = page.getByTestId('primitive-size-square')
    const className = await element.getAttribute('class')

    expect(className).toContain('h_')
  })

  test('size prop resolves equal rendered dimensions', async ({ page }) => {
    const element = page.getByTestId('primitive-size-square')

    const computed = await readComputedStyle(element, ['height', 'width'])

    expect(computed.width).toBeTruthy()
    expect(computed.height).toBe(computed.width)
  })

  test('combined custom props keep font family, weight, and size together below the responsive threshold', async ({ page }) => {
    const element = page.getByTestId('primitive-combined-custom-props-narrow')
    const computed = await readComputedStyle(element, ['font-family', 'font-weight', 'font-size', 'width', 'height'])

    expectFontFamilyIncludes(computed['font-family'], 'Inter')
    expect(computed['font-weight']).toBe('700')
    expect(computed['font-size']).toBe('16px')
    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('8px')
  })

  test('combined custom props activate the responsive branch without losing size above the threshold', async ({ page }) => {
    const element = page.getByTestId('primitive-combined-custom-props-wide')
    const computed = await readComputedStyle(element, ['font-size', 'width', 'height'])

    expect(computed['font-size']).toBe('18px')
    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('8px')
  })

  test('primitive plus css prop class composition stays stable after ref sync rebuilds', async ({ page }) => {
    test.setTimeout(120_000)

    const originalSource = readFileSync(primitiveCssPropFixtureSourcePath, 'utf-8')
    const updatedSource = originalSource
      .replace("label: 'CSS prop primitive'", "label: 'CSS prop primitive after ref sync'")
      .replace("rebuildMarker: 'stable-v1'", "rebuildMarker: 'stable-v2'")

    expect(updatedSource).not.toBe(originalSource)

    const element = page.getByTestId('primitive-css-prop')
    const originalClassName = await element.getAttribute('class')

    expect(originalClassName).toContain('ref-div')
    expect(originalClassName).not.toContain('[object Object]')

    try {
      writeFileSync(primitiveCssPropFixtureSourcePath, updatedSource)
      runRefSync()

      await expect
        .poll(
          async () => {
            await reloadPrimitivesApp(page)

            const updatedElement = page.getByTestId('primitive-css-prop')
            const computed = await readComputedStyle(updatedElement, ['position'])

            return {
              className: await updatedElement.getAttribute('class'),
              marker: await updatedElement.getAttribute('data-rebuild-marker'),
              position: computed.position,
              text: await updatedElement.textContent(),
            }
          },
          { timeout: 60_000 },
        )
        .toEqual({
          className: originalClassName,
          marker: 'stable-v2',
          position: 'relative',
          text: 'CSS prop primitive after ref sync',
        })
    } finally {
      writeFileSync(primitiveCssPropFixtureSourcePath, originalSource)
      runRefSync()
    }
  })
})