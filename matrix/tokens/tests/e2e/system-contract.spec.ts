import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { matrixTokensMarker } from '../../src/index'
import { tokensMatrixConstants } from '../../src/styles'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..', '..')
const pandaConfigPath = join(packageRoot, '.reference-ui', 'panda.config.ts')
const stylesOutputPath = join(packageRoot, '.reference-ui', 'react', 'styles.css')
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

function toCssVariableName(tokenName: string): string {
  return `--colors-${tokenName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase()}`
}

async function reloadTokensApp(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('tokens-root')).toBeVisible({ timeout: 15_000 })
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

test.describe('tokens contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the tokens fixture root', async ({ page }) => {
    expect(matrixTokensMarker).toBe('reference-ui-matrix-tokens')
    await expect(page.getByTestId('tokens-root')).toBeVisible()
  })

  test('renders the tokens fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI tokens matrix' })).toBeVisible()
  })

  test('tokens() drives primitive text color', async ({ page }) => {
    const element = page.getByTestId('tokens-primitive')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb(tokensMatrixConstants.primaryValue))
  })

  test('tokens() drives css() text color', async ({ page }) => {
    const element = page.getByTestId('tokens-css')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb(tokensMatrixConstants.primaryValue))
  })

  test('tokens() drives css() background color', async ({ page }) => {
    const element = page.getByTestId('tokens-css')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb(tokensMatrixConstants.mutedValue))
  })

  test('removes renamed source tokens from generated output and the browser consumes the replacement values', async ({ page }) => {
    test.setTimeout(120_000)

    const originalSource = readFileSync(stylesSourcePath, 'utf-8')
    const replacementPrimaryToken = 'matrixReplacementPrimaryToken'
    const replacementPrimaryValue = '#dc2626'
    const replacementMutedToken = 'matrixReplacementMutedToken'
    const replacementMutedValue = '#16a34a'
    const updatedSource = originalSource
      .replace("primaryToken: 'matrixPrimaryToken'", `primaryToken: '${replacementPrimaryToken}'`)
      .replace("primaryValue: '#2563eb'", `primaryValue: '${replacementPrimaryValue}'`)
      .replace("mutedToken: 'matrixMutedToken'", `mutedToken: '${replacementMutedToken}'`)
      .replace("mutedValue: '#94a3b8'", `mutedValue: '${replacementMutedValue}'`)

    expect(updatedSource).not.toBe(originalSource)

    try {
      writeFileSync(stylesSourcePath, updatedSource)
      runRefSync()

      await expect
        .poll(
          async () => {
            await reloadTokensApp(page)

            const primitive = await readComputedStyle(page.getByTestId('tokens-primitive'), ['color'])
            const css = await readComputedStyle(page.getByTestId('tokens-css'), ['color', 'background-color'])

            return {
              primitive: primitive.color,
              cssColor: css.color,
              cssBackground: css['background-color'],
            }
          },
          { timeout: 60_000 },
        )
        .toEqual({
          primitive: hexToRgb(replacementPrimaryValue),
          cssColor: hexToRgb(replacementPrimaryValue),
          cssBackground: hexToRgb(replacementMutedValue),
        })

      const generatedConfig = readFileSync(pandaConfigPath, 'utf-8')
      const generatedStyles = readFileSync(stylesOutputPath, 'utf-8')

      expect(generatedConfig).toContain(replacementPrimaryToken)
      expect(generatedConfig).toContain(replacementMutedToken)
      expect(generatedConfig).not.toContain(tokensMatrixConstants.primaryToken)
      expect(generatedConfig).not.toContain(tokensMatrixConstants.mutedToken)
      expect(generatedStyles).toContain(toCssVariableName(replacementPrimaryToken))
      expect(generatedStyles).toContain(toCssVariableName(replacementMutedToken))
      expect(generatedStyles).not.toContain(toCssVariableName(tokensMatrixConstants.primaryToken))
      expect(generatedStyles).not.toContain(toCssVariableName(tokensMatrixConstants.mutedToken))
    } finally {
      writeFileSync(stylesSourcePath, originalSource)
      runRefSync()
    }
  })
})