/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function focusedTestId(page: Page) {
  return page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid')
  )
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-NAV-01: arrows wrap through enabled options, skipping disabled, focus stays', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const opt = (testid: string) => page.getByTestId(testid)
    await input.click()

    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-bravo'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-charlie'))
    // Wraps past the disabled delta back to alpha.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-alpha'))
    // Wraps back up to charlie.
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(input, opt('log-opt-charlie'))
    expect(await focusedTestId(page)).toBe('log-input')
  })
});
