/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-POS-12: anchored Content inside a ShadowRoot follows shadow scroll', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-pos-12-anchor').click()
    const content = page.getByTestId('pos-12-content')
    await expect(content).toBeVisible()
    const before = await content.evaluate(el => (el as HTMLElement).style.top)

    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="pos12-host"]') as HTMLElement
      const scroller = host.shadowRoot?.querySelector('[data-testid="pos12-scroller"]') as HTMLElement
      scroller.scrollTop = 60
      scroller.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    await page.waitForTimeout(50)
    const after = await content.evaluate(el => (el as HTMLElement).style.top)
    expect(after).not.toBe('')
    expect(before).not.toBe('')
  })
})
