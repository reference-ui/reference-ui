/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceFixture')
  })

  test('PR-NEST-06: Coordinates a nested child that opens and closes during the parent exit', async ({
    mount,
    page,
  }) => {
    await mount('components/Presence/Presence/PresenceNestedBornClosedFixture')
    const parent = page.getByTestId('bornclosed-parent')
    const child = page.getByTestId('bornclosed-child')

    await expect(parent).toBeVisible()

    // Start the parent exit, then open and close the born-closed child mid-exit.
    await page.getByTestId('btn-toggle-bornclosed-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await page.getByTestId('btn-toggle-bornclosed-child').click()
    await expect(child).toBeVisible()
    await page.getByTestId('btn-toggle-bornclosed-child').click()
    await expect(child).toHaveAttribute('data-state', 'closed')

    // Both settle once the longer child exit completes.
    await expect(parent).toHaveCount(0, { timeout: 3000 })
    await expect(child).toHaveCount(0, { timeout: 3000 })
    await snap(page, 'bornclosed-coordinated-removed')
  })
});
