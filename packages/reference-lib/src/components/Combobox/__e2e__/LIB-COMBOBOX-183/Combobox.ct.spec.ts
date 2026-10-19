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
  test('CB-ENV-03 windowed: one current scroll request resolves in the owning root', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ShadowWindowedLog')

    const host = page.getByTestId('sw-host')
    const input = page.getByTestId('sw-input')
    const popover = page.getByTestId('sw-popover')
    await input.click()
    await expect(popover).toBeVisible()
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await expectActiveDescendant(input, page.getByTestId('sw-opt-4'))

    // Exactly one current scroll request; the deferred ID resolves in
    // the shadow root with focus on the source.
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'sw-scroll-log')).toEqual(['scroll:5'])
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('sw-apply').click()
    await expectActiveDescendant(input, page.getByTestId('sw-opt-5'))
    const descId = await input.getAttribute('aria-activedescendant')
    expect(
      await host.evaluate((el, id) => !!el.shadowRoot?.getElementById(id!), descId)
    ).toBe(true)
    expect(
      await host.evaluate(
        el =>
          ((el.shadowRoot?.activeElement ?? null) as HTMLElement | null)?.getAttribute(
            'data-testid'
          ) ?? null
      )
    ).toBe('sw-input')
  })
});
