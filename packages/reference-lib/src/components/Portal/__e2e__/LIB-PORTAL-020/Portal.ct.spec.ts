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

  test('PT-THEME-06: Root theme toggle updates portaled surface live without remounting', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-live-portal').click()
    const content = page.getByTestId('portal-live-content')
    await expect(content).toBeVisible()

    // Initially light
    expect(await content.getAttribute('data-color-mode')).toBe('light')
    await snap(page, 'portal-live-light')

    // Attach a marker attribute to ensure the node is NOT remounted when theme updates
    await content.evaluate(el => {
      el.setAttribute('data-preserved-instance', 'true')
    })

    // Toggle theme to dark on the root primitive
    await page.getByTestId('btn-toggle-live-root-theme').click()

    // Assert live update to dark without remount
    await expect(content).toHaveAttribute('data-color-mode', 'dark')
    expect(await content.getAttribute('data-preserved-instance')).toBe('true')
    await snap(page, 'portal-live-toggled-dark')
  })
});
