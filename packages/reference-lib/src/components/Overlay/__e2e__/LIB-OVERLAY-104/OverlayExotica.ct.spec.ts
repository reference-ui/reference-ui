/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-INERT-06: nested ShadowRoot siblings hide; shadow hosts stay reachable', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-inert-06').click()
    await expect(page.getByTestId('inert-06-content')).toBeVisible()

    const flags = await page.evaluate(() => {
      const light = document.querySelector('[data-testid="btn-light-sibling"]') as HTMLElement | null
      const host = document.querySelector('[data-testid="nested-shadow-host"]') as HTMLElement | null
      const outer = host?.shadowRoot
      const outerSibling = outer?.querySelector('[data-testid="outer-shadow-sibling"]') as HTMLElement | null
      const innerHost = outer?.querySelector('[data-testid="inner-shadow-host"]') as HTMLElement | null
      const innerSibling = innerHost?.shadowRoot?.querySelector(
        '[data-testid="inner-shadow-sibling"]'
      ) as HTMLElement | null
      const inner = innerHost?.shadowRoot?.querySelector('[data-testid="btn-inert-06-inner"]') as HTMLElement | null
      return {
        lightInert: Boolean(light && (light.hasAttribute('inert') || light.closest('[inert]'))),
        outerSiblingInert: outerSibling?.hasAttribute('inert') ?? false,
        innerSiblingInert: innerSibling?.hasAttribute('inert') ?? false,
        hostInert: host?.hasAttribute('inert') ?? true,
        innerHostInert: innerHost?.hasAttribute('inert') ?? true,
        innerDisabled: Boolean(inner && (inner.hasAttribute('inert') || inner.closest('[inert]'))),
        innerFound: Boolean(inner),
      }
    })

    expect(flags.lightInert).toBe(true)
    expect(flags.outerSiblingInert).toBe(true)
    expect(flags.innerSiblingInert).toBe(true)
    expect(flags.hostInert).toBe(false)
    expect(flags.innerHostInert).toBe(false)
    expect(flags.innerFound).toBe(true)
    expect(flags.innerDisabled).toBe(false)
  })
})
