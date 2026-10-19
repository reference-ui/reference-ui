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

  test('PT-THEME-04: Document-only data-color-mode on ownerDocument stamps first primitive without React context', async ({
    page,
  }) => {
    // Set data-color-mode on documentElement directly (no React context override)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-color-mode', 'dark')
    })

    await page.getByTestId('btn-mount-doc-only').click()
    const node = page.getByTestId('portal-doc-only-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        backgroundColor: style.backgroundColor,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    await snap(page, 'portal-doc-only-dark')

    // Clean up documentElement attribute
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-color-mode')
    })
  })
});
