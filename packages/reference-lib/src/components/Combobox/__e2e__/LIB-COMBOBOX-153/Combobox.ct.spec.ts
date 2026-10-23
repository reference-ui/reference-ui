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

async function clickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

test.describe('Combobox cluster B CT', () => {
  test('CB-ADAPTER-07: grid typeahead follows current metadata and cancels stale requests', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/StaleGridLog')
    const input = page.getByTestId('sg-input')
    await input.focus()
    await input.pressSequentially('z')
    expect(await logOf(page, 'sg-log')).toContain('scroll:37')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    // Replace metadata, then mount the stale window: index 37 now holds
    // another value and must not publish.
    await clickNoFocus(page, 'sg-replace')
    await clickNoFocus(page, 'sg-grow')
    await expect(page.getByTestId('sg-cell-i-36-37')).toBeVisible()
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    // The same value under current metadata scrolls once (still
    // unmounted) and publishes only after its own window mounts.
    // Select-all + type avoids an empty-text intermediate scroll.
    await input.press('ControlOrMeta+a')
    await input.pressSequentially('b')
    expect((await logOf(page, 'sg-log')).filter(entry => entry.startsWith('scroll:'))).toEqual([
      'scroll:37',
      'scroll:12',
    ])
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await clickNoFocus(page, 'sg-grow2')
    const zuluId = await page.getByTestId('sg-cell-zulu-12').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', zuluId ?? '')
  })
});
