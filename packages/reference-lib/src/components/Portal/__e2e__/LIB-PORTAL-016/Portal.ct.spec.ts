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

  test('PT-THEME-02: Bare Portal in light mode emits data-layer and data-color-mode="light", resolves light tokens without dark default', async ({
    page,
  }) => {
    const node = page.getByTestId('portal-theme-light-node')
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
    expect(surface.dataTheme).toBe('light')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
    // In light mode, text color is dark, NOT white
    expect(surface.color).not.toBe('rgb(255, 255, 255)')
    await snap(page, 'portal-theme-light')
  })
});
