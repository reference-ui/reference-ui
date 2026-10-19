/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-RESTORE-08: restoreFocus resolver is evaluated at Presence teardown', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-restore-08-a').focus()
    await page.getByTestId('btn-open-restore-08').click()
    const content = page.getByTestId('restore-08-content')
    await expect(content).toBeVisible()

    await page.getByTestId('btn-close-restore-08').click()
    await expect(content).toBeVisible()
    await page.evaluate(() => {
      ;(window as unknown as { __ovRestore08: (v: 'a' | 'b') => void }).__ovRestore08('b')
    })
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('btn-restore-08-b')).toBeFocused()
  })
})
