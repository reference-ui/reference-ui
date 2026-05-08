import { expect, test, type Page } from '@playwright/test'

const expectedFontContract = {
  fontDisplay: 'swap',
  monoFamily: 'JetBrains Mono',
  sansFamily: 'Inter',
  serifDescentOverride: '47%',
  serifFamily: 'Literata',
  serifSizeAdjust: '104%',
} as const

async function readComputedStyle(
  page: Page,
  testId: string,
  property: string,
): Promise<string> {
  return page.getByTestId(testId).evaluate((node: Element, propertyName: string) => {
    return getComputedStyle(node).getPropertyValue(propertyName).trim()
  }, property)
}

async function readMountedStyles(page: Page): Promise<string> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('style'))
      .map((element) => element.textContent ?? '')
      .join('\n')
  })
}

test.describe('font contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('font() applies authored font families to primitives', async ({ page }) => {
    const sansFamily = await readComputedStyle(page, 'font-sans-default', 'font-family')
    const serifFamily = await readComputedStyle(page, 'font-serif-default', 'font-family')
    const monoFamily = await readComputedStyle(page, 'font-mono-bold', 'font-family')

    expect(sansFamily).toContain(expectedFontContract.sansFamily)
    expect(serifFamily).toContain(expectedFontContract.serifFamily)
    expect(monoFamily).toContain(expectedFontContract.monoFamily)
  })

  test('font() applies the font-level css contribution to primitives', async ({ page }) => {
    const letterSpacing = await readComputedStyle(page, 'font-sans-default', 'letter-spacing')

    expect(parseFloat(letterSpacing)).toBeLessThan(0)
  })

  test('font() maps named and compound font weights onto primitives', async ({ page }) => {
    const namedWeight = await readComputedStyle(page, 'font-mono-bold', 'font-weight')
    const compoundWeight = await readComputedStyle(page, 'font-sans-compound', 'font-weight')

    expect(namedWeight).toBe('700')
    expect(compoundWeight).toBe('700')
  })

  test('mounted stylesheet contains authored font-face rules and advanced font-face fields', async ({ page }) => {
    const styles = await readMountedStyles(page)

    expect(styles).toContain('@font-face')
    expect(styles).toContain(expectedFontContract.sansFamily)
    expect(styles).toContain(expectedFontContract.serifFamily)
    expect(styles).toContain(expectedFontContract.monoFamily)
    expect(styles).toMatch(new RegExp(`font-display:\\s*${expectedFontContract.fontDisplay}`))
    expect(styles).toMatch(new RegExp(`size-adjust:\\s*${expectedFontContract.serifSizeAdjust}`))
    expect(styles).toMatch(
      new RegExp(`descent-override:\\s*${expectedFontContract.serifDescentOverride}`),
    )
  })
})