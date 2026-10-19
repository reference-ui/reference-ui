/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-POINTER-03: Listbox should leave focus and selection unchanged when an option is only hovered', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await alpha.focus()
    await bravo.hover()
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    // Pen hover likewise carries no collection state
    await bravo.evaluate(el =>
      (el as HTMLElement).dispatchEvent(
        new PointerEvent('pointerenter', { pointerType: 'pen', bubbles: true })
      )
    )
    await page.mouse.move(0, 0)
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
  })
});
