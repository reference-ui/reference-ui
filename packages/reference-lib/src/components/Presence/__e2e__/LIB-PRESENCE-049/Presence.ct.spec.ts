/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence mixed and interrupted lifecycles', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceRaceFixture')
  })

  test('PR-RACE-03: Creates a fresh completion set when a child closes again after reopening', async ({
    page,
  }) => {
    const box = page.getByTestId('race-r03')
    const count = page.getByTestId('racecount-r03')
    await page.getByTestId('btn-toggle-r03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-r03').click()
    await expect(box).toHaveAttribute('data-state', 'open')
    await page.getByTestId('btn-toggle-r03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')

    // Exit A's stale completion cannot remove exit B's child.
    await page.waitForTimeout(50)
    const handle = await page.$('[data-testid="race-r03"]')
    await box.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')

    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(200)
    await expect(count).toHaveText('1')
  })
});
