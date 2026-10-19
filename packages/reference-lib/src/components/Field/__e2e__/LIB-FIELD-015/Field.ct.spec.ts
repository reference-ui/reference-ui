/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-SURF-01: Field-surface hosts should share one bezel recipe across the documented compositions', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/SurfaceRecipeFixture')

    const f1 = page.getByTestId('surf-fixture-1')
    const f2 = page.getByTestId('surf-fixture-2')
    const f3 = page.getByTestId('surf-fixture-3')
    const f4 = page.getByTestId('surf-fixture-4')

    // All 4 have data-reference-field
    await expect(f1).toHaveAttribute('data-reference-field', '')
    await expect(f2).toHaveAttribute('data-reference-field', '')
    await expect(f3).toHaveAttribute('data-reference-field', '')
    await expect(f4).toHaveAttribute('data-reference-field', '')

    // Fixture 4 (NumberField) has role="group", 1-3 have no role
    await expect(f4).toHaveAttribute('role', 'group')
    await expect(f1).not.toHaveAttribute('role')
    await expect(f2).not.toHaveAttribute('role')
    await expect(f3).not.toHaveAttribute('role')

    await expect(f4).toBeVisible()
    await page.waitForTimeout(300)

    // Compare baseline chrome (borderWidth, borderStyle, borderRadius) across all 4 hosts
    const getChrome = async (locator: typeof f1) =>
      locator.evaluate(el => {
        const s = window.getComputedStyle(el)
        return {
          borderWidth: s.borderWidth,
          borderStyle: s.borderStyle,
          borderRadius: s.borderRadius,
        }
      })

    const c1 = await getChrome(f1)
    const c2 = await getChrome(f2)
    const c3 = await getChrome(f3)
    const c4 = await getChrome(f4)

    expect(c1.borderWidth).toBe('1px')
    expect(c1.borderStyle).toBe('solid')
    expect(c2.borderWidth).toBe(c1.borderWidth)
    expect(c3.borderWidth).toBe(c1.borderWidth)
    expect(c4.borderWidth).toBe(c1.borderWidth)
    expect(c2.borderRadius).toBe(c1.borderRadius)
    expect(c3.borderRadius).toBe(c1.borderRadius)
    expect(c4.borderRadius).toBe(c1.borderRadius)

    await page.waitForTimeout(300)
    await snap(page, 'field-surface')

    // Switch to warning state and assert identical warning border across 1 and 4
    await page.getByTestId('btn-surf-warning').click()
    await page.waitForTimeout(300)
    const w1Border = await f1.evaluate(el => window.getComputedStyle(el).borderColor)
    const w4Border = await f4.evaluate(el => window.getComputedStyle(el).borderColor)
    // Both produce amber warning border hues
    expect(w1Border.startsWith('oklab(0.7') || w1Border.startsWith('oklch(0.7')).toBe(true)
    expect(w4Border.startsWith('oklab(0.7') || w4Border.startsWith('oklch(0.7')).toBe(true)

    // Switch to invalid state and assert identical invalid border
    await page.getByTestId('btn-surf-invalid').click()
    await page.waitForTimeout(300)
    const inv1Border = await f1.evaluate(el => window.getComputedStyle(el).borderColor)
    const inv4Border = await f4.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(inv1Border).toBe(inv4Border)
    expect(inv1Border).not.toBe(w1Border)

    // Switch to disabled state and assert identical opacity
    await page.getByTestId('btn-surf-disabled').click()
    await page.waitForTimeout(250)
    const d1Op = await f1.evaluate(el => window.getComputedStyle(el).opacity)
    const d4Op = await f4.evaluate(el => window.getComputedStyle(el).opacity)
    expect(Number(d1Op)).toBeCloseTo(0.5, 1)
    expect(Number(d4Op)).toBeCloseTo(0.5, 1)
  })
});
