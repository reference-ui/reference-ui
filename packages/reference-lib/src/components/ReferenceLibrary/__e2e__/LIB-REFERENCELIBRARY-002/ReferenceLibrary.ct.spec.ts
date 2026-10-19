/**
 * ReferenceLibrary composition gates and browser proofs. Renders the
 * application transparently, elects the earliest live mount as active
 * host, serves imperative toasts with live-region updates, fails over to
 * standby on unmount, and follows the mounting root's color mode.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('ReferenceLibrary Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/ReferenceLibrary/ReferenceLibrary/ReferenceLibraryFixture')
    await expect(page.getByTestId('ref-library-fixture-root')).toBeVisible()
  })

  test('RL-DOM-02 & RL-LIFE-03: Displays imperative toast in active host and updates live regions', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-toast').click()

    const toastItem = page.locator('[data-toast-id="toast-save"]')
    await expect(toastItem).toBeVisible()
    await expect(toastItem).toHaveText('Saved Draft Successfully')
    await snap(page, 'toast-displayed')

    await page.getByTestId('btn-announce').click()
    const politeAnnouncer = page.locator('[data-reference-announcer="polite"]')
    await expect(politeAnnouncer).toHaveText('File uploaded completely')
    await snap(page, 'polite-announced')
  })
});
