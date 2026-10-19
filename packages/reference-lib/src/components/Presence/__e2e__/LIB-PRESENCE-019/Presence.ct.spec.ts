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

  test('PR-NEST-05: Exits a parent with an animated exit when a nested Presence was born closed', async ({
    mount,
    page,
  }) => {
    await mount('components/Presence/Presence/PresenceNestedBornClosedFixture')
    const parent = page.getByTestId('bornclosed-parent')

    await expect(parent).toBeVisible()
    await expect(page.getByTestId('bornclosed-child')).toHaveCount(0)

    await page.getByTestId('btn-toggle-bornclosed-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')

    // The never-opened nested child must not strand the 150ms parent exit.
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'bornclosed-removed')
  })
});
