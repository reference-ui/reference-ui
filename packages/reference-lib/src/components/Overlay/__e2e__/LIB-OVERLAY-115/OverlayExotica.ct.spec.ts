/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-EDGE-05: edge=left stays physical left under RTL', async ({ mount, page }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
    })
    await page.getByTestId('btn-open-edge-05').click()
    const content = page.getByTestId('edge-05-content')
    await expect(content).toBeVisible()
    const box = await content.evaluate(el => {
      const s = el as HTMLElement
      return { left: s.style.left, right: s.style.right, edge: s.getAttribute('data-edge') }
    })
    expect(box.edge).toBe('left')
    expect(box.left).toBe('0px')
    expect(box.right).toBe('')
    await page.evaluate(() => {
      document.documentElement.dir = 'ltr'
    })
  })
})
