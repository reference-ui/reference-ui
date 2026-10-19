/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence CSS transition exits', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceTransitionFixture')
  })

  test('PR-TRANSITION-06: Ignores unrelated perpetual transitions when only a finite close-state change defines the exit', async ({
    page,
  }) => {
    await page.getByTestId('btn-toggle-t06').click()
    await expect(page.getByTestId('trans-t06')).toHaveAttribute('data-state', 'closed')
    // The 100s color declaration never starts; removal tracks the 200ms close
    // transition and must beat the 5s fallback by a wide margin.
    await expect(page.getByTestId('trans-t06')).toHaveCount(0, { timeout: 2000 })
  })
});
