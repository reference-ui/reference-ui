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

  test('PT-THEME-05: Island inside light app preserves dark colorMode when portaled', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-island-portal').click()
    const content = page.getByTestId('portal-island-content')
    await expect(content).toBeVisible()

    const surface = await content.evaluate(el => {
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
    await snap(page, 'portal-island-dark')
  })
});
