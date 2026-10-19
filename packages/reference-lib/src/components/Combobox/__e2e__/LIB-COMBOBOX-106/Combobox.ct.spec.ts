/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-EDIT-03 caret: Home and End move the caret with the active option unchanged', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/CaretField')

    const input = page.getByTestId('caret-input')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // bare Home/End are caret no-ops in Firefox/WebKit native
    // editing (identical key events, different default action), so the
    // click-placed caret (end, 11) stays put there. The product contract
    // — keys unhandled, active option unchanged, zero callbacks — is
    // asserted identically on all engines below.
    const homeEnd = browserName === 'chromium' ? 0 : 11
    await page.keyboard.press('Home')
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(homeEnd)
    await page.keyboard.press('End')
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(11)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    expect(await readLog(page, 'caret-log')).toEqual([])
  })
});
