/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence nested exit coordination (interrupt and removal)', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceNestExitFixture')
  })

  test('PR-NEST-02: Releases a descendant wait when that descendant returns to present during the parent exit', async ({
    page,
  }) => {
    const parent = page.getByTestId('nestexit-parent')
    const parentCount = page.getByTestId('nestexitcount-parent')
    const childCount = page.getByTestId('nestexitcount-child')
    const childHandle = await page.$('[data-testid="nestexit-child"]')

    await page.getByTestId('btn-toggle-nestexit-parent').click()
    await page.getByTestId('btn-toggle-nestexit-child').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    // The parent's own 150ms effect finishes while the child 350ms exit runs.
    await page.waitForTimeout(200)
    await expect(parent).toHaveCount(1)

    await page.getByTestId('btn-toggle-nestexit-child').click()
    // The canceled descendant exit no longer strands the still-closed parent:
    // the subtree removes once and the interrupted child never reports an exit.
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('nestexit-child')).toHaveCount(0)
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')

    await childHandle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'transform' }))
    )
    await page.waitForTimeout(200)
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')
  })
});
