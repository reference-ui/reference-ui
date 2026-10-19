/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox reconciliation CT', () => {
  test('LB-CB-04: only the activedescendant-named option publishes active styling', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DynamicOptions')

    const input = page.getByTestId('dyn-input')
    await input.click()
    await page.keyboard.press('ArrowDown')
    const bravo = page.getByTestId('dyn-opt-bravo')
    await expectActiveDescendant(input, bravo)

    // Only bravo carries data-active; alpha keeps selected state independently.
    await expect(bravo).toHaveAttribute('data-active', '')
    await expect(page.getByTestId('dyn-opt-alpha')).not.toHaveAttribute('data-active', '')
    await expect(page.getByTestId('dyn-opt-charlie')).not.toHaveAttribute('data-active', '')
    await expect(page.getByTestId('dyn-opt-alpha')).toHaveAttribute('data-state', 'selected')
    await page.waitForTimeout(300)
    await snap(page, 'combobox-lb-cb-04-highlight')

    // Removing the active option leaves no stale reference behind.
    await page.getByTestId('dyn-remove-bravo').click()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const alpha = page.getByTestId('dyn-opt-alpha')
    await expectActiveDescendant(input, alpha)
  })
});
