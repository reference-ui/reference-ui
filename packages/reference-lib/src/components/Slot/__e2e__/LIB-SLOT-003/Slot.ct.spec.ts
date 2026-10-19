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

  test('SL-COMP-01: A host renders registered parts in named regions when fillers commit first', async ({
    page,
  }) => {
    const header = page.getByTestId('region-header')
    const footer = page.getByTestId('region-footer')

    await expect(header.getByTestId('slotted-title')).toHaveText('Initial Title')
    await expect(footer.getByTestId('btn-action-primary')).toBeVisible()
    await expect(footer.getByTestId('btn-action-secondary')).toBeVisible()
    await snap(page, 'initial-slotted-parts')
  })
})
