/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox cluster B CT', () => {
  test('CB-DOM-04: popover owns a stable id and derives grid role only from the adapter', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/GridLog')
    const gridInput = page.getByTestId('grid-input')
    await gridInput.click()
    const gridPopover = page.getByTestId('grid-popover')
    await expect(gridPopover).toHaveAttribute('role', 'grid')
    const gridId = await gridPopover.getAttribute('id')
    await gridInput.pressSequentially('x')
    expect(await gridPopover.getAttribute('id')).toBe(gridId)

    await mount('components/Combobox/Combobox/ControlledLog')
    await page.getByTestId('log-input').click()
    await expect(page.getByTestId('log-popover')).toHaveAttribute('role', 'presentation')
    await expect(page.getByTestId('log-popover').getByRole('listbox')).toBeVisible()

    await mount('components/Combobox/Combobox/TreePopupLog')
    await page.getByTestId('tp-input').click()
    await expect(page.getByTestId('tp-popover')).toHaveAttribute('role', 'presentation')
    await expect(page.getByTestId('tp-tree')).toBeVisible()
  })
});
