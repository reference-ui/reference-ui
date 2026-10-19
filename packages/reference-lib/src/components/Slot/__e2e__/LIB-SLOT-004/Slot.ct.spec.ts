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

  test('SL-COMP-02: A host refreshes slotted content on an in-place rerender without a remount key', async ({
    page,
  }) => {
    const slottedTitle = page.getByTestId('slotted-title')
    await expect(slottedTitle).toHaveText('Initial Title')

    const initialMountCount = await slottedTitle.getAttribute('data-mount-count')
    expect(initialMountCount).toBeTruthy()

    await page.getByTestId('btn-update-title').click()

    await expect(slottedTitle).toHaveText('Updated Title')
    // Mount count must remain unchanged (proves no remount occurred)
    await expect(slottedTitle).toHaveAttribute('data-mount-count', initialMountCount!)
    await snap(page, 'updated-title-in-place')
  })
})
