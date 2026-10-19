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

  test('PR-TRANSITION-03: Waits for the last property when a closing child transitions multiple properties', async ({
    page,
  }) => {
    const box = page.getByTestId('trans-t03')
    await page.getByTestId('btn-toggle-t03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await box.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await expect(box).toHaveCount(1)
    // The real 100ms opacity completion also leaves the child mounted.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })
});
