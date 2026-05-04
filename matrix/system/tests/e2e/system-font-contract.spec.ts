import { expect, test, type Page } from '@playwright/test'

import { systemMatrixConstants } from '../../src/system/styles'

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

test.describe('system font contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('font() applies the named family to primitives', async ({ page }) => {
    const fontFamily = await readComputedStyle(page, 'system-font-probe', 'font-family')

    expect(fontFamily).toContain(systemMatrixConstants.fontFaceFamily)
  })

  test('font() maps named weights onto primitives', async ({ page }) => {
    const fontWeight = await readComputedStyle(page, 'system-font-probe', 'font-weight')

    expect(fontWeight).toBe('700')
  })

  test('mounted stylesheet contains the authored @font-face rule', async ({ page }) => {
    const styles = await readMountedStyles(page)

    expect(styles).toContain('@font-face')
    expect(styles).toContain(systemMatrixConstants.fontFaceFamily)
    expect(styles).toMatch(
      new RegExp(`font-display:\\s*${systemMatrixConstants.fontDisplay}`),
    )
  })

  test('mounted stylesheet contains the font css contribution from font()', async ({ page }) => {
    const styles = await readMountedStyles(page)

    expect(styles).toMatch(new RegExp(`letter-spacing:\\s*${systemMatrixConstants.fontLetterSpacingValue.replace('.', '\\.').replace('-', '\\-')}`))
  })
})
