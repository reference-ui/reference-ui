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

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-EDIT-09: isComposing keys never open, move, or commit', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NoCustomLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')

    // Composing arrows on the closed source: no open, no active, no log.
    await input.focus()
    await input.evaluate(el => {
      for (const key of ['ArrowDown', 'ArrowUp']) {
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, isComposing: true }))
      }
    })
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'log-counts')).toEqual([])

    // Composing arrows while open never move: the exposed descendant
    // is preserved, the popover stays, and nothing is requested.
    await input.click()
    await expect(popover).toBeVisible()
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))
    await input.evaluate(el => {
      for (const key of ['ArrowDown', 'ArrowUp']) {
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, isComposing: true }))
      }
    })
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))
    await expect(popover).toBeVisible()
    expect(await readLog(page, 'log-counts')).toEqual(['open'])

    // Composing Enter never commits; the same key post-composition does.
    await input.fill('a')
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    await input.evaluate(el => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true }))
    })
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    await expect(popover).toBeVisible()
    expect(await readLog(page, 'log-counts')).toEqual(['open', 'input:a'])
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'log-counts')).toEqual(['open', 'input:a', 'change:alpha', 'dismiss'])
    await expect(popover).toHaveCount(0)
  })
});
