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

  test('PR-RACE-06: Cleans up immediately when Presence itself unmounts during an exit', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(String(err)))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const handle = await page.$('[data-testid="race-r06"]')
    await page.getByTestId('btn-toggle-r06').click()
    await expect(page.getByTestId('race-r06')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-r06-mounted').click()
    await expect(page.getByTestId('race-r06')).toHaveCount(0)

    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(300)
    await expect(page.getByTestId('race-r06')).toHaveCount(0)
    const slotHtml = await page.getByTestId('race-r06-slot').evaluate(el => el.innerHTML)
    expect(slotHtml).toBe('')
    expect(errors).toEqual([])
  })
});
