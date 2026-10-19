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

  test('RL-ROOT-03: Fails over active host to standby when primary host unmounts', async ({
    page,
  }) => {
    // Show toast
    await page.getByTestId('btn-show-toast').click()
    await expect(page.locator('[data-toast-id="toast-save"]')).toBeVisible()

    // Unmount primary root
    await page.getByTestId('btn-toggle-primary').click()

    // Toast host now fails over to root-standby
    const standbyToastHost = page
      .getByTestId('root-standby')
      .locator('[data-reference-toast-host]')

    await expect(standbyToastHost).toHaveCount(1)
    await expect(standbyToastHost.locator('[data-toast-id="toast-save"]')).toBeVisible()
    await snap(page, 'toast-failover-to-standby')
  })
});
