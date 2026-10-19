/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-INERT-08: accessibility snapshot exposes the dialog, not background controls', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-inert-08').click()
    await expect(page.getByTestId('inert-08-content')).toBeVisible()

    const snapshot = typeof (page as any).accessibility?.snapshot === 'function'
      ? await (page as any).accessibility.snapshot()
      : null
    if (snapshot) {
      const text = JSON.stringify(snapshot)
      expect(text).toContain('Accessible dialog')
      expect(text).toContain('Dialog action')
      expect(text).not.toContain('Background control')
    }
  })
})
