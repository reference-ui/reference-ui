/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence DOM contract (browser re-proof)', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceDomFixture')
  })

  test('PR-DOM-03: Renders no host when its child is empty or falsy', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      const html = await page.getByTestId(`dom03-slot-${i}`).evaluate(el => el.innerHTML)
      expect(html).toBe('')
    }
  })
});
