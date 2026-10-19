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
  test('CB-ENV-04 chromium: cross-engine baseline order for the native gate', async ({
    mount,
    page,
    browserName,
  }) => {
    // G1: chromium gate by design — skip off-Chromium (never red
    // elsewhere). Matrix engine layer owns the other engines.
    test.skip(browserName !== 'chromium', 'G1: chromium UA gate')
    // Chromium half of the multi-engine gate: pins the exact public DOM,
    // focus, and controlled callback order Firefox/WebKit runs compare
    // against (matrix engine layer owns the other engines).
    expect(await page.evaluate(() => navigator.userAgent)).toContain('Chrome')
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await page.keyboard.type('a')
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    await expect(input).toBeFocused()
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'log-counts')).toEqual(['open', 'input:a', 'change:alpha', 'dismiss'])
    await expect(popover).toHaveCount(0)

    await mount('components/Combobox/Combobox/WindowedTriggerLog')
    const trigger = page.getByTestId('wt-trigger')
    await trigger.click()
    await expect(page.getByTestId('wt-popover')).toBeVisible()
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown')
    }
    expect(await readLog(page, 'wt-scroll-log')).toEqual(['scroll:10'])
    await expect(trigger).toBeFocused()
  })
});
