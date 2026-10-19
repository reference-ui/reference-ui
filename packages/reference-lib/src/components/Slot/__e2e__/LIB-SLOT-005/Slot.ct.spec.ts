/**
 * Slot browser gates: named-region rendering, in-place live refresh
 * without remount, prefix-region selection, and visibility honors
 * (SL-COMP-01–04). Snapshots pin settled paint; videos carry motion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Slot Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Slot/Slot/SlotFixture')
    await expect(page.getByTestId('slot-fixture-root')).toBeVisible()
  })

  test('SL-COMP-03: A host selects a region of slot ids when several entries share a region kind', async ({
    page,
  }) => {
    const header = page.getByTestId('region-header')
    const footer = page.getByTestId('region-footer')

    await expect(header).toHaveAttribute(
      'data-cache-key',
      'actions.primary,actions.secondary'
    )
    await expect(footer.getByTestId('btn-action-primary')).toBeVisible()
    await expect(footer.getByTestId('btn-action-secondary')).toBeVisible()
  })
})
