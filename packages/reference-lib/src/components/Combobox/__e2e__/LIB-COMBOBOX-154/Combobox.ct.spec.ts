/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function logOf(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

async function clickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

function captureComboboxDiagnostics(page: Page) {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('[reference-ui] Combobox')) {
      errors.push(msg.text())
    }
  })
  return errors
}

test.describe('Combobox cluster B CT', () => {
  test('CB-ADAPTER-08: competing authorities diagnose, stay inert, and recover', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/ConflictLog')
    expect(errors.some(text => text.includes('exactly one collection authority'))).toBe(true)
    expect(errors.some(text => text.includes('virtualFocus') && text.includes('listbox'))).toBe(true)

    const input = page.getByTestId('cf-input')
    await input.click()
    await expect(page.getByTestId('cf-popover')).toHaveAttribute('role', 'presentation')

    await input.press('ArrowDown')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('cf-opt-alpha').hover()
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('cf-opt-alpha').click()
    expect(await logOf(page, 'cf-log')).toEqual(['open'])

    // Single-authority rerender recovers navigation and commit.
    await clickNoFocus(page, 'cf-toggle')
    await input.press('ArrowDown')
    const cellId = await page.getByTestId('cf-cell-cell-00').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', cellId ?? '')
    await page.getByTestId('cf-cell-cell-00').click()
    expect(await logOf(page, 'cf-log')).toContain('change:cell-00')
  })
});
