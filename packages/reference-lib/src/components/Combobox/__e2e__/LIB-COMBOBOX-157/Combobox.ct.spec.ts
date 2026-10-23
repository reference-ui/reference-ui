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

async function inputState(input: Locator) {
  return input.evaluate((el: HTMLInputElement) => ({
    value: el.value,
    start: el.selectionStart,
    end: el.selectionEnd,
  }))
}

async function clickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

test.describe('Combobox cluster B CT', () => {
  test('CB-COMP-02: filtered both-mode consumer across edit, commit, escape, blur, tab, reject', async ({
    mount,
    page,
    browserName,
  }) => {
    test.setTimeout(60000)
    await mount('components/Combobox/Combobox/FilterBothLog')
    const input = page.getByTestId('fb-input')

    // Edit filters; completion tracks; Enter commits one ordered sequence.
    // Delay lets each keystroke commit, so suffix replacement is deterministic.
    await input.focus()
    await input.pressSequentially('alp', { delay: 100 })
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 3, end: 5 })
    await input.press('Enter')
    // Controlled input: the app applies the label from onChange, so no
    // input: request follows the commit (COMMIT-01 order is uncontrolled).
    // Suffix replacement preserves the completed capital (Al, Alp).
    expect(await logOf(page, 'fb-log')).toEqual([
      'input:a',
      'open',
      'input:Al',
      'input:Alp',
      'change:alpha',
      'dismiss',
    ])
    expect((await inputState(input)).value).toBe('Alpha')

    // Unmatched text reverts on Escape.
    await input.click()
    await input.fill('Zulu')
    await clickNoFocus(page, 'fb-clear')
    await input.press('Escape')
    expect(await logOf(page, 'fb-log')).toEqual(['input:Alpha', 'dismiss'])
    expect((await inputState(input)).value).toBe('Alpha')

    // Blur outside reverts-or-keeps then dismisses once.
    await input.click()
    await page.getByTestId('fb-outside').click()
    expect(await logOf(page, 'fb-log')).toEqual(['input:Alpha', 'dismiss', 'open', 'dismiss'])

    // Tab with no keyboard intent closes natively onto the next control.
    await input.click()
    await clickNoFocus(page, 'fb-clear')
    await input.press('Tab')
    expect(await logOf(page, 'fb-log')).toEqual(['dismiss'])
    if (browserName === 'webkit') {
      // dismiss proven above; native traversal skips the
      // After button to body (probe P-TAB).
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
        null
      )
    } else {
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
        'fb-after'
      )
    }

    // Rejected requests cannot create accepted state.
    await clickNoFocus(page, 'fb-accept')
    await page.getByTestId('fb-before').focus()
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(await logOf(page, 'fb-log')).toContain('open')
  })
});
