/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-MULTI-05: Listbox should not invent range or select-all behavior for modifier keys', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiFive')
    await expect(page.getByTestId('m5-root')).toBeVisible()

    const calls = page.getByTestId('m5-calls')
    await page.getByTestId('m5-charlie').focus()

    for (const key of [
      'Shift+ArrowDown',
      'Control+ArrowDown',
      'Meta+ArrowDown',
      'Shift+Home',
      'Shift+End',
    ]) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('ControlOrMeta+a')

    await expect(calls).toHaveText('[]')
    await expect(page.getByTestId('m5-bravo')).toHaveAttribute('aria-selected', 'true')
    for (const item of ['alpha', 'charlie', 'delta', 'echo']) {
      await expect(page.getByTestId(`m5-${item}`)).toHaveAttribute('aria-selected', 'false')
    }
  })
});
