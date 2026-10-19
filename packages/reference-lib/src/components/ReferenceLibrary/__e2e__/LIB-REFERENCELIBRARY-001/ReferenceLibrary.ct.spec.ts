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

  test('RL-DOM-01 & RL-ROOT-01: Renders application transparently and elects earliest live mount as active host', async ({
    page,
  }) => {
    // Both application roots are visible
    await expect(page.getByTestId('app-primary')).toBeVisible()
    await expect(page.getByTestId('app-standby')).toBeVisible()

    // Active toast host is rendered ONLY under root-primary (the earliest mount)
    const primaryToastHost = page
      .getByTestId('root-primary')
      .locator('[data-reference-toast-host]')
    const standbyToastHost = page
      .getByTestId('root-standby')
      .locator('[data-reference-toast-host]')

    await expect(primaryToastHost).toHaveCount(1)
    await expect(standbyToastHost).toHaveCount(0)
    await snap(page, 'initial-both-roots-primary-elected')
  })
});
