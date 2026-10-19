/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-NAV-08: newly active option scrolls inside the popover; page and input unmoved', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/LongList')

    const input = page.getByTestId('long-input')
    await input.click()
    // Park the cursor off-fixture so no hover highlight races the arrows.
    await page.mouse.move(6, 6)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowDown')
    }
    // opt-05 is disabled, so 12 arrows land on opt-12.
    const target = page.getByTestId('long-opt-opt-12')
    await expectActiveDescendant(input, target)
    await expect(target).toBeInViewport()
    const listScrollTop = await page
      .getByTestId('long-popover')
      .locator('[role="listbox"]')
      .evaluate(el => (el as HTMLElement).scrollTop)
    expect(listScrollTop).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await expect(input).toBeInViewport()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  })
});
