/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal ShadowRoot event contract (FEATURES #1, PORTAL-OWNS)', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/ShadowFixture')
    await expect(page.getByTestId('portal-shadow-fixture-root')).toBeVisible()
  })

  test('PT-DOM-05: Children land directly inside the open ShadowRoot destination', async ({
    page,
  }) => {
    await page.getByTestId('btn-shadow-attach').click()
    const host = page.getByTestId('portal-shadow-host')
    await expect(page.getByTestId('portal-shadow-btn')).toBeVisible()

    const placement = await host.evaluate(el => {
      const root = el.shadowRoot
      if (!root) return null
      const kids = Array.from(root.children).map(n => n.getAttribute('data-testid'))
      return {
        kids,
        btnParentIsRoot: root.querySelector('[data-testid="portal-shadow-btn"]')?.parentNode === root,
        siblingParentIsRoot:
          root.querySelector('[data-testid="portal-shadow-sibling"]')?.parentNode === root,
      }
    })
    expect(placement).not.toBeNull()
    // Direct shadow children in authored order, no wrapper.
    expect(placement!.kids).toEqual(['portal-shadow-btn', 'portal-shadow-sibling'])
    expect(placement!.btnParentIsRoot).toBe(true)
    expect(placement!.siblingParentIsRoot).toBe(true)
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="portal-shadow-sibling"]'))
    ).toBe(false)
  })
});
