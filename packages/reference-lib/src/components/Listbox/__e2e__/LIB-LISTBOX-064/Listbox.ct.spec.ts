/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-POINTER-02: Listbox should select once from direct touch activation without a hover prerequisite', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    // No hover, no keyboard: a bare touch press + compat mouse sequence
    await bravo.evaluate(el => {
      const target = el as HTMLElement
      target.dispatchEvent(
        new PointerEvent('pointerdown', { pointerType: 'touch', button: 0, bubbles: true })
      )
      target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
      target.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }))
      target.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }))
    })
    await expect(calls).toHaveText('["bravo"]')
  })
});
