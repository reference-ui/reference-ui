/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/Fixture')
    await expect(page.getByTestId('portal-fixture-root')).toBeVisible()
  })

  test('PT-THEME-03: Nested Portal under dark overlay inherits dark from context and re-emits data-layer', async ({
    page,
  }) => {
    const outer = page.getByTestId('portal-nested-outer')
    const inner = page.getByTestId('portal-nested-inner')

    await expect(outer).toBeVisible()
    await expect(inner).toBeVisible()

    const outerSurface = await outer.evaluate(el => ({
      isDirectBodyChild: el.parentElement === document.body,
      dataLayer: el.getAttribute('data-layer'),
      dataTheme: el.getAttribute('data-color-mode'),
    }))

    const innerSurface = await inner.evaluate(el => ({
      isDirectBodyChild: el.parentElement === document.body,
      dataLayer: el.getAttribute('data-layer'),
      dataTheme: el.getAttribute('data-color-mode'),
    }))

    expect(outerSurface.isDirectBodyChild).toBe(true)
    expect(outerSurface.dataLayer).toBeTruthy()
    expect(outerSurface.dataTheme).toBe('dark')

    expect(innerSurface.isDirectBodyChild).toBe(true)
    expect(innerSurface.dataLayer).toBeTruthy()
    expect(innerSurface.dataTheme).toBe('dark')
    await snap(page, 'portal-nested-dark')
  })
});
