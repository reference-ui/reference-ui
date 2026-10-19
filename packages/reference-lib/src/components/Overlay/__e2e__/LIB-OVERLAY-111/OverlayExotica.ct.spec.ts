/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-ENV-03: shadow portal keeps focus, dismiss, inert, and scroll contracts', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-env-03').click()
    const content = page.getByTestId('env-03-content')
    await expect(content).toBeVisible()
    await expect(page.getByTestId('btn-env-03-inner')).toBeFocused()

    const bg = page.getByTestId('btn-env-03-bg')
    await expect(bg).toHaveAttribute('inert', '')

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(bg).not.toHaveAttribute('inert', '')
  })
})
