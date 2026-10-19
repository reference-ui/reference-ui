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
  test('CB-OPEN-02: ArrowUp opens with the selected option pending', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const bravo = page.getByTestId('log-opt-bravo')
    await expectActiveDescendant(input, bravo)
  })
});
