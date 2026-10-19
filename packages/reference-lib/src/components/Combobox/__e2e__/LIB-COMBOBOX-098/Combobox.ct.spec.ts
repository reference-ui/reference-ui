/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

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

test.describe('Combobox reconciliation CT', () => {
  test('CB-DOM-09/CB-COMMIT-04: nonmodal tab order with tab commit and native traversal', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/TabOrder')

    const before = page.getByTestId('tab-before')
    const input = page.getByTestId('tab-input')
    const after = page.getByTestId('tab-after')
    // WebKit click never focuses buttons and Tab skips them;
    // text inputs stay tab stops.
    const isWebKit = browserName === 'webkit'

    if (isWebKit) {
      await before.focus()
    } else {
      await before.click()
    }
    await expect(before).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(input).toBeFocused()
    // #11: focus alone never opens.
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    // Closed ArrowDown opens with first enabled pending; the next arrow
    // derives keyboard intent, which Tab commits while traversing natively.
    await page.keyboard.press('ArrowDown')
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const apple = page.getByTestId('tab-opt-apple')
    await expectActiveDescendant(input, apple)

    await page.keyboard.press('ArrowDown')
    const banana = page.getByTestId('tab-opt-banana')
    await expectActiveDescendant(input, banana)

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-value-display')).toHaveText('Selected: banana')
    if (isWebKit) {
      // Commit + dismiss proven above; native traversal skips the
      // After button to body (probe P-TAB).
      expect(await focusedTestId(page)).toBeNull()
    } else {
      await expect(after).toBeFocused()
    }
    await expect(input).toHaveAttribute('aria-expanded', 'false')
  })
});
