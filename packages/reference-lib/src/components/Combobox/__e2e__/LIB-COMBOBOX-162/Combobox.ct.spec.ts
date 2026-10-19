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

test.describe('Combobox text restore, dialog blur, and custom value CT', () => {
  test('recommitting the identical value emits no onChange', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')
    const input = page.getByTestId('log-input')

    // Pointer path: clicking the already-selected option closes silently.
    // (No log-clear clicks: pressing the outside button would itself
    // dismiss the popup. The committed value never changes, so the whole
    // log must stay free of change: entries.)
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await page.getByTestId('log-opt-bravo').click()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    let log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log).toContain('dismiss')

    // Keyboard path: arrows back onto the committed value + Enter.
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    // Reopen must settle onto the committed value before arrows run: without
    // this, a first-frame Down can hit an empty registration order and noop,
    // leaving Up to walk bravo→alpha (react18 matrix flake).
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
  })
});
