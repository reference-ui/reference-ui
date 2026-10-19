/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-CB-04: Listbox should publish local active styling state when Combobox virtually focuses one mounted Option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboBasic')
    await expect(page.getByTestId('cb-root')).toBeVisible()

    const input = page.getByTestId('cb-input')
    const alpha = page.getByTestId('cb-alpha')
    const bravo = page.getByTestId('cb-bravo')

    // Commit alpha so selection and activity diverge
    await input.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: alpha')

    // Move virtual activity to bravo. The reopen resolver pre-selects the
    // committed alpha on React 19 but can lag a frame on 17/18, so step
    // until bravo is active instead of assuming the starting point.
    await input.click()
    const bravoId = await bravo.getAttribute('id')
    for (let i = 0; i < 3; i++) {
      if ((await input.getAttribute('aria-activedescendant')) === bravoId) break
      await page.keyboard.press('ArrowDown')
    }
    await expect(input).toHaveAttribute('aria-activedescendant', bravoId ?? '')
    await expect(bravo).toHaveAttribute('data-active', '')
    await expect(alpha).not.toHaveAttribute('data-active')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(alpha).toHaveAttribute('tabindex', '-1')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    // Pointer activity moves the same single active marker in one commit
    // (hovering the committed alpha is leave-restore-ignored by Combobox
    // policy, so this phase hovers non-committed charlie instead)
    const charlie = page.getByTestId('cb-charlie')
    await charlie.hover()
    const charlieId = await charlie.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', charlieId ?? '')
    await expect(charlie).toHaveAttribute('data-active', '')
    await expect(bravo).not.toHaveAttribute('data-active')

    // Dismissal unmounts the window and clears the source reference together
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('cb-popover')).toBeHidden()
    await expect(input).not.toHaveAttribute('aria-activedescendant')
  })
});
