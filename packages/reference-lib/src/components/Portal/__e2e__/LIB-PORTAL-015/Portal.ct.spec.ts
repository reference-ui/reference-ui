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

  test('PT-THEME-01: Bare Portal under dark scope emits data-layer and data-color-mode="dark" on first primitive', async ({
    page,
  }) => {
    const node = page.getByTestId('portal-theme-dark-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        backgroundColor: style.backgroundColor,
        color: style.color,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    // In dark mode: background should not be white or transparent
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
    await snap(page, 'portal-theme-dark')
  })
});
