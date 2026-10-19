/**
 * FocusLock browser proofs: composition gates across init, tab loop,
 * reclaim, shards, catalog, nesting, restore, and DOM rows. Mounts the
 * fixture lab and asserts containment, arbitration, and restoration in
 * a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/FocusLock/FocusLock/Fixture')
    await expect(page.getByTestId('focus-lock-fixture-root')).toBeVisible()
  })

  test('FL-TRAP-08: removing the focused node reclaims focus before the next task', async ({
    page,
  }) => {
    await page.getByTestId('btn-trap-mode-remove').click()
    await page.getByTestId('btn-open-trap').click()
    // Activation's initial focus runs in a passive effect; React 17 can flush it
    // inside the focus call below and move focus back to trap-a. Wait for it first.
    await expect(page.getByTestId('trap-a')).toBeFocused()
    const result = await page.evaluate(async () => {
      const node = document.querySelector<HTMLElement>('[data-testid="trap-c"]')
      node?.focus()
      if (!node || document.activeElement !== node) {
        throw new Error('trap-c must hold focus before removal')
      }
      node.remove()
      // remove() queues the lock's observer microtask ahead of this continuation:
      // the repair must land without waiting for an animation frame.
      await Promise.resolve()
      const lock = document.querySelector('[data-testid="trap-lock"]')
      return {
        inside: Boolean(lock?.contains(document.activeElement)),
        body: document.activeElement === document.body,
      }
    })
    expect(result.inside).toBe(true)
    expect(result.body).toBe(false)
  })
});
