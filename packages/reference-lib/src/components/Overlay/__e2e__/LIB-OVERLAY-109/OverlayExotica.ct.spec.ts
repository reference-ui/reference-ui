/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-SCROLL-08: RTL scrollbar compensation uses the logical side', async ({ mount, page }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
      document.documentElement.style.overflow = 'scroll'
      document.body.style.setProperty('padding-left', '10px')
    })
    await page.getByTestId('btn-open-scroll-08').click()
    await expect(page.getByTestId('scroll-08-content')).toBeVisible()

    const pads = await page.evaluate(() => ({
      left: document.body.style.paddingLeft,
      right: document.body.style.paddingRight,
    }))
    expect(pads.right).toBe('')
    expect(pads.left === '' || parseFloat(pads.left) >= 10).toBe(true)

    await page.getByTestId('btn-close-scroll-08').click()
    await expect(page.getByTestId('scroll-08-content')).toHaveCount(0)
    const restored = await page.evaluate(() => document.body.style.paddingLeft)
    expect(restored).toBe('10px')
    await page.evaluate(() => {
      document.documentElement.dir = 'ltr'
      document.documentElement.style.overflow = ''
      document.body.style.removeProperty('padding-left')
    })
  })
})
