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
  test('CB-VIRT-01: windowed Listbox target scrolls into the DOM before its active ID publishes', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/WindowedLog')

    const input = page.getByTestId('wl-input')
    const popover = page.getByTestId('wl-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // Indices 0..4 mounted: five Downs land index 4 with a real ID.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await expectActiveDescendant(input, page.getByTestId('wl-opt-4'))
    expect(await readLog(page, 'wl-scroll-log')).toEqual([])

    // The sixth Down targets unmounted index 5: exactly one scroll
    // request, focus stays, and no ID publishes while absent.
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'wl-scroll-log')).toEqual(['scroll:5:gen0'])
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(input).toBeFocused()

    // Applying the scroll mounts the window; the real ID publishes.
    await page.getByTestId('wl-apply').click()
    await expectActiveDescendant(input, page.getByTestId('wl-opt-5'))
    await page.getByTestId('wl-input').focus()
    await expect(input).toBeFocused()
    expect(await readLog(page, 'wl-scroll-log')).toEqual(['scroll:5:gen0'])
  })
});
