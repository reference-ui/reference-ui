/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DOM-12: Listbox should deliver native scroll events from its fixed root without interpreting them', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ScrollNative')
    await expect(page.getByTestId('scroll-root')).toBeVisible()

    const listbox = page.getByTestId('scroll-listbox')
    const alpha = page.getByTestId('scroll-alpha')
    const events = page.getByTestId('scroll-events')
    const calls = page.getByTestId('scroll-calls')

    await alpha.focus()
    await expect(alpha).toHaveAttribute('tabindex', '0')

    // Programmatic scroll
    await listbox.evaluate(el => {
      ;(el as HTMLElement).scrollTop = 40
    })
    await expect(events).toHaveText('["DIV"]')

    // User scroll input
    await listbox.hover()
    await page.mouse.wheel(0, 60)
    await expect(events).toHaveText('["DIV","DIV"]')

    // Collection state untouched
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')
  })
});
