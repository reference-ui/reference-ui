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

test.describe('Combobox reconciliation CT', () => {
  test('CB-DOM-12: one popover with collision-safe bottom-start placement', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FruitSelect')

    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await expect(popover).toHaveAttribute('data-side', 'bottom')
    await expect(popover).toHaveAttribute('data-align', 'start')
    await expectAnchoredBottomStart(input, popover)
    await expect(page.getByTestId('combobox-popover')).toHaveCount(1)
  })
});
