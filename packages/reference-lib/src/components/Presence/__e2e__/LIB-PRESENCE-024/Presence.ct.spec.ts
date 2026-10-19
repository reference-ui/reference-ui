/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence onExitComplete', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceExitCompleteFixture')
  })

  test('PR-EXIT-04: Does not fire onExitComplete on initial mount', async ({
    page,
  }) => {
    for (const id of [
      'exitcount-transition',
      'exitcount-instant',
      'exitcount-interrupt',
      'exitcount-wedge-parent',
      'exitcount-wedge-child',
      'exitcount-coord-parent',
      'exitcount-coord-child',
    ]) {
      await expect(page.getByTestId(id)).toHaveText('0')
    }
  })
});
