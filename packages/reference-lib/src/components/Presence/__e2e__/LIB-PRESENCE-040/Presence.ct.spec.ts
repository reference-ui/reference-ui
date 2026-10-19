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

  test('PR-TRANSITION-05: Completes a suspended exit when the observed transition is canceled', async ({
    page,
  }) => {
    const handle = await page.$('[data-testid="trans-t05"]')
    await page.getByTestId('btn-toggle-t05').click()
    await expect(page.getByTestId('trans-t05')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    await page.getByTestId('trans-t05').evaluate(el => ((el as HTMLElement).style.transition = 'none'))
    await expect(page.getByTestId('trans-t05')).toHaveCount(0, { timeout: 2000 })
    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(200)
    await expect(page.getByTestId('trans-t05')).toHaveCount(0)
  })
});
