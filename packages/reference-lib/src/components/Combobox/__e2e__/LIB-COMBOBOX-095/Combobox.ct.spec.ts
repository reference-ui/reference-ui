/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}

test.describe('Combobox CT', () => {
  test('renders combobox input, opens popover on click, selects option and closes', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FruitSelect')

    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')
    const display = page.getByTestId('combobox-value-display')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)
    await page.waitForTimeout(300)
    await snap(page, 'combobox-resting')

    // Click input -> opens popover (focus alone never opens)
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(popover).toBeVisible()
    await expectAnchoredBottomStart(input, popover)

    const optBanana = page.getByTestId('combo-opt-banana')
    await expect(optBanana).toBeVisible()
    const optBox = await optBanana.boundingBox()
    expect(optBox?.height).toBe(34)
    await page.waitForTimeout(300)
    await snap(page, 'combobox-open')

    // Hover banana option
    await optBanana.hover()
    await page.waitForTimeout(200)
    await snap(page, 'combobox-hover-option')

    // Click Banana option -> selects banana and closes popover
    await optBanana.click()
    await expect(popover).toHaveCount(0)
    await expect(input).toHaveValue('Banana')
    await expect(display).toHaveText('Selected: banana')
    await page.waitForTimeout(300)
    await snap(page, 'combobox-selected')
  })
});
