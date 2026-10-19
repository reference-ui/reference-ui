/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence CSS animation exits', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceAnimationFixture')
  })

  test('PR-ANIMATION-07: Ignores infinite animations when a closing child also has finite exit effects', async ({
    page,
  }) => {
    // Infinity alone never suspends.
    const btnA = page.getByTestId('btn-toggle-a07a')
    await btnA.click()
    await expect(btnA).toHaveAttribute('aria-expanded', 'false')
    const absentA = await page.evaluate(() => !document.querySelector('[data-testid="anim-a07a"]'))
    expect(absentA).toBe(true)

    // Infinity plus a finite transition retains only until the finite effect ends.
    const boxB = page.getByTestId('anim-a07b')
    await page.getByTestId('btn-toggle-a07b').click()
    await expect(boxB).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    await expect(boxB).toHaveCount(1)
    await expect(boxB).toHaveCount(0, { timeout: 2000 })
  })
});
