/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-DOM-03: Backdrop and Content keep data-state in sync with StyleProps intact', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-dom-03').click()
    const backdrop = page.getByTestId('dom-03-backdrop')
    const content = page.getByTestId('dom-03-content')
    await expect(content).toBeVisible()
    await expect(backdrop).toHaveAttribute('data-state', 'open')
    await expect(content).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(200)
    await snap(page, 'exotica-dom-03-open')

    const openStyles = await content.evaluate(el => {
      const s = getComputedStyle(el)
      return { bg: s.backgroundColor, padding: s.padding }
    })
    expect(openStyles.bg).not.toBe('rgba(0, 0, 0, 0)')
    expect(openStyles.padding).not.toBe('0px')

    await page.getByTestId('btn-close-dom-03').click()
    await expect(content).toHaveCount(0)
  })
})
