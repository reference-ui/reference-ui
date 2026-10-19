/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('interactive and portaled row content never (de)selects', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RowActions')
    const display = page.getByTestId('rowactions-value-display')
    await expect(display).toHaveText('Selected: events')

    // (a) In-row trigger press: the popover opens, selection untouched.
    await page.getByTestId('row-trigger-events').click()
    await expect(page.getByTestId('row-popover-events')).toBeVisible()
    await expect(display).toHaveText('Selected: events')

    // (b) Portaled action click bubbles through the React tree but is outside
    // the row's DOM subtree: the action fires, selection untouched.
    await page.getByTestId('row-action-pin').click()
    await expect(display).toHaveText('Selected: events')
    const log = JSON.parse(
      (await page.getByTestId('rowactions-log').textContent()) ?? '[]'
    )
    expect(log).toEqual(['action:pin'])

    // Plain row press still toggles.
    await page.getByTestId('row-opt-alerts').click()
    await expect(display).toHaveText('Selected: events, alerts')
  })
});
