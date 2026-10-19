/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-KEY-06: Listbox should leave unsupported navigation keys and modifiers to the browser or application', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.focus()
    await page.keyboard.press('Escape')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('PageUp')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('PageDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('Alt+ArrowDown')
    await page.keyboard.press('Control+ArrowDown')
    await page.keyboard.press('Meta+ArrowDown')
    await expect(calls).toHaveText('[]')

    // Modified activation never selects
    await bravo.focus()
    for (const key of [
      'Control+Enter',
      'Meta+Enter',
      'Alt+Enter',
      'Shift+Enter',
      'Control+Space',
      'Shift+Space',
    ]) {
      await page.keyboard.press(key)
    }
    await expect(calls).toHaveText('[]')

    // Native Tab movement is untouched
    await bravo.focus()
    await page.keyboard.press('Tab')
    if (browserName === 'firefox') {
      // Firefox keeps focus on the lone sequential
      // stop (two Tabs stay on req-bravo) while Chromium leaves it.
      // Platform wrap, not product hijack: no request was made (calls []
      // above) and focus never enters unmanaged territory.
      await expect(bravo).toBeFocused()
    } else {
      expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).not.toBe(
        'option'
      )
    }
  })
});
