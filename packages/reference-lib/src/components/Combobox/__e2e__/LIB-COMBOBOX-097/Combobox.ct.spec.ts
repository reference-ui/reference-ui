/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox reconciliation CT', () => {
  test('CB-DOM-01: transparent coordinator with native parts and controlled relationships', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(input).toHaveAttribute('aria-haspopup', 'listbox')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)

    await input.click()
    await expect(popover).toBeVisible()
    const tag = await popover.evaluate(el => el.tagName)
    expect(tag).toBe('DIV')
    await expect(popover).toHaveAttribute('role', 'presentation')
    await expect(popover.locator('[role="listbox"]')).toBeVisible()
    const controls = await input.getAttribute('aria-controls')
    expect(controls).toBe(await popover.getAttribute('id'))
  })
});
