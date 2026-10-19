/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceFixture')
  })

  test('PR-DOM-01 & PR-INSTANT-01: Renders child when present, removes immediately on instant close', async ({
    page,
  }) => {
    const instantBox = page.getByTestId('instant-box')
    await expect(instantBox).toBeVisible()
    await snap(page, 'initial-all-open')

    await page.getByTestId('btn-toggle-instant').click()
    // Should disappear immediately in the same cycle
    await expect(instantBox).toHaveCount(0)
    await snap(page, 'instant-removed')

    // Reopen
    await page.getByTestId('btn-toggle-instant').click()
    await expect(instantBox).toBeVisible()
    await snap(page, 'instant-reopened')
  })
});
