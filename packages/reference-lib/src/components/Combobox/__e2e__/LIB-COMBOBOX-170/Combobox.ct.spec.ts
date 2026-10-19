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
  test('CB-VIRT-02: rapid windowed navigation and metadata replacement keep only the latest request', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/WindowedLog')

    const input = page.getByTestId('wl-input')
    await input.click()
    await expect(page.getByTestId('wl-popover')).toBeVisible()
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await expectActiveDescendant(input, page.getByTestId('wl-opt-4'))

    // Three keys while the first window is pending: each request is
    // current at its own time, but nothing publishes until mount.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'wl-scroll-log')).toEqual([
      'scroll:5:gen0',
      'scroll:6:gen0',
      'scroll:7:gen0',
    ])
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(input).toBeFocused()

    // Replacing metadata before mounting clears the stale pending slot:
    // the fallback resolves within the latest collection only, never
    // the stale value.
    await page.getByTestId('wl-replace').click()
    await expectActiveDescendant(input, page.getByTestId('wl-opt-0'))
    await expect(page.getByTestId('wl-opt-0')).toHaveAttribute('data-value', /^repl-/)
    await expect(input).toBeFocused()

    // Moving the window re-resolves within the latest collection again.
    await page.getByTestId('wl-apply').click()
    await expectActiveDescendant(input, page.getByTestId('wl-opt-3'))
    await expect(page.getByTestId('wl-opt-3')).toHaveAttribute('data-value', /^repl-/)
    await expect(input).toBeFocused()

    // Post-replacement navigation uses only the latest callback, and
    // unmounted targets defer again behind one current request.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown')
    }
    const scrolls = await readLog(page, 'wl-scroll-log')
    expect(scrolls[scrolls.length - 1]).toBe('scroll:8:gen1')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(input).toBeFocused()
  })
});
