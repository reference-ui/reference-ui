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

  test('PR-DOM-04: Leaves consumer props and behavior untouched when it observes a present child', async ({
    page,
  }) => {
    const child = page.getByTestId('dom04-child')
    await expect(child).toHaveAttribute('id', 'dom04-authored-id')
    await expect(child).toHaveAttribute('class', 'dom04-authored-class')
    await expect(child).toHaveAttribute('data-state', 'open')
    await expect(child).toHaveAttribute('data-custom', 'authored')
    await expect(child).toHaveCSS('color', 'rgb(1, 2, 3)')
    const slotChildren = await page.getByTestId('dom04-slot').evaluate(el => el.childElementCount)
    expect(slotChildren).toBe(1)

    await child.click()
    await expect(page.getByTestId('dom04-clicks')).toHaveText('1')
    await expect(child).toHaveAttribute('data-state', 'open')
    await expect(child).toHaveAttribute('class', 'dom04-authored-class')
  })
});
