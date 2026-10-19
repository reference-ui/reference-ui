/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-GROUP-06: Virtual Listbox should keep logical position metadata independent of group depth', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualGroups')
    await expect(page.getByTestId('vg-root')).toBeVisible()

    const scrollLog = page.getByTestId('vg-scroll-log')
    for (const index of [20, 21, 22, 23]) {
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute('aria-setsize', '50')
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute(
        'aria-posinset',
        String(index + 1)
      )
    }

    // Logical navigation ignores DOM order: 21 -> mounted 22 directly
    await page.getByTestId('vg-opt-21').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vg-opt-22')).toBeFocused()
    await expect(scrollLog).toHaveText('[]')

    // Reorder only the group DOM: labels and metadata survive
    await page.getByTestId('vg-swap').click()
    await expect(page.getByTestId('vg-group-a')).toHaveAttribute('aria-label', 'Group A')
    await expect(page.getByTestId('vg-group-inner')).toHaveAttribute('aria-label', 'Inner B')
    for (const index of [20, 21, 22, 23]) {
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute('aria-setsize', '50')
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute(
        'aria-posinset',
        String(index + 1)
      )
    }

    // Navigation still follows the logical adapter, not group position
    await page.getByTestId('vg-opt-23').focus()
    await page.keyboard.press('ArrowDown')
    await expect(scrollLog).toHaveText('[24]')
  })
});
