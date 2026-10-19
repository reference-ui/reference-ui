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

  test('PR-DOM-05: Observes only the current keyed child when a present child is replaced', async ({
    page,
  }) => {
    await expect(page.getByTestId('dom05-child-A')).toBeVisible()
    await page.getByTestId('btn-dom05-swap').click()
    await expect(page.getByTestId('dom05-child-A')).toHaveCount(0)
    await expect(page.getByTestId('dom05-child-B')).toBeVisible()

    // The gallery wraps stories in StrictMode, which double-invokes ref
    // callbacks on React 18/19 (single on 17), and stable composed refs
    // attribute the replaced fiber's detach to the current callback — so
    // assert the contract shape, not exact counts: A mounted first, the
    // swap detached and attached, and B is the current attachment.
    const log = await page.evaluate(() => (window as any).__dom05log as string[])
    const count = (e: string) => log.filter(x => x === e).length
    expect(log[0]).toBe('refA:attach')
    expect(count('refA:detach') + count('refB:detach')).toBeGreaterThanOrEqual(1)
    expect(count('refB:attach')).toBeGreaterThanOrEqual(1)
    expect(log[log.length - 1]).toBe('refB:attach')

    // A's previously captured exit event cannot remove the replacement.
    await page
      .getByTestId('dom05-child-B')
      .evaluate(el => el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true })))
    await expect(page.getByTestId('dom05-child-B')).toBeVisible()
    await expect(page.getByTestId('dom05-child-A')).toHaveCount(0)
  })
});
