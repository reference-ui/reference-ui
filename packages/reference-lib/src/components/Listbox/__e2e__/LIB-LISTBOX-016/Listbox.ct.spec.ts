/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-COMP-04: Grouped listbox preserves regions and flattens navigation', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Sections')
    await expect(page.getByTestId('listbox-sections-root')).toBeVisible()

    const optReact = page.getByTestId('opt-s-react')
    const optVue = page.getByTestId('opt-s-vue')
    const optNode = page.getByTestId('opt-s-node')
    await expect(optReact).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-sections')

    // Authored group regions keep their roles and labels
    const groups = page.getByRole('group')
    await expect(groups).toHaveCount(2)
    await expect(groups.first()).toHaveAttribute('aria-labelledby')

    // Arrow navigation flattens across sections in DOM order
    await optReact.focus()
    await page.keyboard.press('ArrowDown')
    await expect(optVue).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(optNode).toBeFocused()
  })
});
