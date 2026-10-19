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

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-DOM-10 blur: omitted closeOnBlur restores committed text and dismisses on blur', async ({
    mount,
    page,
  }) => {
    // DefaultsLog omits inputValue, autocomplete, allowCustomValue, and
    // closeOnBlur; only the option callbacks are spied (and ignored).
    await mount('components/Combobox/Combobox/DefaultsLog')

    const input = page.getByTestId('df-input')
    const popover = page.getByTestId('df-popover')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await input.click()
    await expect(popover).toBeVisible()
    await page.keyboard.type('Zulu')
    await expect(input).toHaveValue('Zulu')

    // closeOnBlur defaults true: blur requests committed-only text ('',
    // nothing committed) and dismissal; nothing is hidden. Programmatic
    // focus isolates the blur path (a pointer press would take the
    // outside path first, and the open popover covers the button).
    await page.getByTestId('df-outside').focus()
    expect(await readLog(page, 'df-log')).toEqual([
      'open',
      'input:Z',
      'input:Zu',
      'input:Zul',
      'input:Zulu',
      'input:',
      'dismiss',
    ])
    await expect(input).toHaveValue('')
    await expect(popover).toHaveCount(0)

    // Reopening restores nothing phantom.
    await input.click()
    await expect(popover).toBeVisible()
    await expect(input).toHaveValue('')
  })
});
