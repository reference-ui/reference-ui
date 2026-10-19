/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-CB-02: windowed Combobox Listbox withholds the active descendant until the virtual target mounts', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboWindowed')
    await expect(page.getByTestId('cbw-root')).toBeVisible()

    const input = page.getByTestId('cbw-input')
    await input.click()
    await expect(page.getByTestId('cbw-popover')).toBeVisible()

    // Window metadata is logical, not DOM-relative
    await expect(page.getByTestId('cbw-opt-0')).toHaveAttribute('aria-setsize', '10')
    await expect(page.getByTestId('cbw-opt-4')).toHaveAttribute('aria-posinset', '5')

    // Mounted navigation tracks real IDs and never invents scroll requests
    await page.keyboard.press('ArrowDown')
    const id0 = await page.getByTestId('cbw-opt-0').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id0 ?? '')
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown')
    }
    const id4 = await page.getByTestId('cbw-opt-4').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id4 ?? '')
    await expect(page.getByTestId('cbw-scroll-log')).toHaveText('[]')

    // Past the window edge the Combobox virtual driver consults the Listbox
    // adapter: exactly one scrollToIndex(5), focus stays, and no ID
    // publishes while the target is absent.
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('cbw-scroll-log')).toHaveText('[5]')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(input).toBeFocused()

    // Mounting the window publishes the stable ID with logical metadata.
    await page.getByTestId('cbw-mount-5-9').click()
    const opt5 = page.getByTestId('cbw-opt-5')
    await expect(opt5).toBeVisible()
    const id5 = await opt5.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id5 ?? '')
    await expect(opt5).toHaveAttribute('aria-posinset', '6')
    await expect(opt5).toHaveAttribute('aria-setsize', '10')
    await expect(input).toBeFocused()

    // Commit keeps stable value identity; reopening re-resolves the
    // committed selection onto its mounted ID.
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cbw-log')).toHaveText('["change:item-5"]')
    await expect(page.getByTestId('cbw-popover')).toHaveCount(0)
    await input.click()
    await expect(page.getByTestId('cbw-popover')).toBeVisible()
    const opt5b = page.getByTestId('cbw-opt-5')
    await expect(opt5b).toBeVisible()
    await expect(opt5b).toHaveAttribute('aria-posinset', '6')
    const id5b = await opt5b.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id5b ?? '')
  })
});
