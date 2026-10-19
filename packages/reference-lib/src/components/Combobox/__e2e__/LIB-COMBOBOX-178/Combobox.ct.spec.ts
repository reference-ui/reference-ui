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

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-COMP-02 list-mode: controlled list consumer across edit, commit, escape, blur, tab', async ({
    mount,
    page,
    browserName,
  }) => {
    // NoCustomLog: controlled list mode, initial bravo/Bravo, live label
    // filtering, disabled delta, and a clear button for blur/Tab targets.
    await mount('components/Combobox/Combobox/NoCustomLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))

    // Native caret/text behavior while editing; list mode never completes.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('al')
    await expect(input).toHaveValue('al')
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(2)
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    expect(await readLog(page, 'log-counts')).toEqual(['open', 'input:a', 'input:al'])

    // Clear the filter, navigate (skipping disabled delta), and commit
    // with one ordered sequence while focus stays on the source.
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Backspace')
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('log-opt-charlie'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(input, page.getByTestId('log-opt-charlie'))
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:a',
      'input:al',
      'input:a',
      'input:',
      'change:charlie',
      'dismiss',
    ])
    await expect(popover).toHaveCount(0)
    await expect(input).toBeFocused()
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    // Unmatched text + Escape reverts to the committed label once.
    await input.click()
    await page.keyboard.type('zzz')
    await expect(input).toHaveValue('Charliezzz')
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:a',
      'input:al',
      'input:a',
      'input:',
      'change:charlie',
      'dismiss',
      'open',
      'input:Charliez',
      'input:Charliezz',
      'input:Charliezzz',
      'input:Charlie',
      'dismiss',
    ])
    await expect(input).toHaveValue('Charlie')
    await expect(input).toBeFocused()

    // Blur outside reverts unmatched text and dismisses (programmatic
    // focus: clicking log-clear would wipe the log under assertion).
    await input.click()
    await page.keyboard.type('q')
    await page.getByTestId('log-clear').focus()
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:a',
      'input:al',
      'input:a',
      'input:',
      'change:charlie',
      'dismiss',
      'open',
      'input:Charliez',
      'input:Charliezz',
      'input:Charliezzz',
      'input:Charlie',
      'dismiss',
      'open',
      'input:Charlieq',
      'input:Charlie',
      'dismiss',
    ])
    await expect(input).toHaveValue('Charlie')
    await expect(popover).toHaveCount(0)

    // Tab commits the keyboard-active option and traverses natively to
    // the next stop with no stale descendant. Clearing the filter keeps
    // charlie (identity follow); arrows wrap past it to bravo.
    await input.click()
    await expect(popover).toBeVisible()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await expectActiveDescendant(input, page.getByTestId('log-opt-charlie'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))
    await page.keyboard.press('Tab')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:a',
      'input:al',
      'input:a',
      'input:',
      'change:charlie',
      'dismiss',
      'open',
      'input:Charliez',
      'input:Charliezz',
      'input:Charliezzz',
      'input:Charlie',
      'dismiss',
      'open',
      'input:Charlieq',
      'input:Charlie',
      'dismiss',
      'open',
      'input:',
      'change:bravo',
      'dismiss',
    ])
    await expect(popover).toHaveCount(0)
    if (browserName === 'webkit') {
      // commit + dismiss proven by the log above; native
      // traversal skips the Clear-log button to body.
      expect(await focusedTestId(page)).toBeNull()
    } else {
      expect(await focusedTestId(page)).toBe('log-clear')
    }
  })
});
