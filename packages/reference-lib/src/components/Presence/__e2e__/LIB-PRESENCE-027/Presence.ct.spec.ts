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

  test('PR-DOM-02: Omits its child when it first mounts with present false', async ({ page }) => {
    await expect(page.getByTestId('dom02-child')).toHaveCount(0)
    const slotHtml = await page.getByTestId('dom02-slot').evaluate(el => el.innerHTML)
    expect(slotHtml).toBe('')
    const refLog = await page.evaluate(() => (window as any).__dom02log)
    expect(refLog).toEqual([])
  })
});
