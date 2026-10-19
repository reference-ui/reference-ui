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

  test('PR-INSTANT-06: Does not strand an exiting child when the owner document is hidden', async ({
    page,
  }) => {
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
    })
    await expectSameCommitRemoval(page, 'i06')
    await page.waitForTimeout(300)
    await expect(page.getByTestId('instant-i06')).toHaveCount(0)
  })
});
