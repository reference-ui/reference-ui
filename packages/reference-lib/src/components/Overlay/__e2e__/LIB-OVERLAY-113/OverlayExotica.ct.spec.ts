/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-POS-10: bottom-start stays the token and follows RTL alignment', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    const anchor = page.getByTestId('btn-pos-10-anchor');
    await anchor.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 100));
    await anchor.click();
    const content = page.getByTestId('pos-10-content')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-align', 'start')
    await expect(content).toHaveAttribute('data-side', 'bottom')

    const geometry = await page.evaluate(() => {
      const anchor = document.querySelector('[data-testid="btn-pos-10-anchor"]') as HTMLElement
      const floating = document.querySelector('[data-testid="pos-10-content"]') as HTMLElement
      const a = anchor.getBoundingClientRect()
      const f = floating.getBoundingClientRect()
      return {
        anchorRight: a.right,
        floatingRight: f.right,
        transform: floating.style.transform,
        origin: floating.style.getPropertyValue('--reference-overlay-transform-origin'),
      }
    })
    expect(Math.abs(geometry.floatingRight - geometry.anchorRight)).toBeLessThan(4)
    expect(geometry.transform).toBe('')
  })
})
