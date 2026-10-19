/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence immediate removal', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceInstantFixture')
  })

  test('PR-INSTANT-03: Removes immediately when the closed state has no effective CSS animation', async ({
    page,
  }) => {
    await expectSameCommitRemoval(page, 'i03a')
    await expectSameCommitRemoval(page, 'i03b')
  })
});
