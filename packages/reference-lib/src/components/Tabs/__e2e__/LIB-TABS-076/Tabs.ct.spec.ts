/**
 * Tabs composition gates and browser proofs. Pins tablist/tab/panel
 * rendering with ARIA linkage, automatic and manual selection, RTL arrow
 * reversal, nested isolation, focus rescue and handoff, dynamic disable
 * and removal, the MyTabs system-variant demo, ShadowRoot locality,
 * keepMounted panels, and real-gesture selection semantics.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test('TB-MANUAL-05: consumer preventDefault cancels manual movement and activation keys', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/ManualKeys')
    await expect(page.getByTestId('tabs-mk-root')).toBeVisible()

    const tabPreview = page.getByTestId('tab-mk-preview')
    const tabSource = page.getByTestId('tab-mk-source')
    const log = page.getByTestId('tabs-mk-log')

    // Arrow run: prevented, stays, consumer logged first.
    await page.getByTestId('mk-prevent-arrow').click()
    await tabSource.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabSource).toBeFocused()
    await expect(log).toHaveText('consumer:ArrowRight')
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-mk-preview')).toBeVisible()
    await page.getByTestId('mk-prevent-arrow').click()

    // Space run: prevented, no request.
    await page.getByTestId('mk-prevent-space').click()
    await tabSource.focus()
    await page.keyboard.press('Space')
    // textContent, not toHaveText: the 'consumer: ' entry ends in a space
    // that toHaveText whitespace normalization would trim.
    expect(await log.textContent()).toBe('consumer:ArrowRight|consumer: ')
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await page.getByTestId('mk-prevent-space').click()

    // Enter run: prevented, no request.
    await page.getByTestId('mk-prevent-enter').click()
    await tabSource.focus()
    await page.keyboard.press('Enter')
    expect(await log.textContent()).toBe(
      'consumer:ArrowRight|consumer: |consumer:Enter'
    )
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-mk-preview')).toBeVisible()
    await expect(page.getByTestId('panel-mk-source')).toBeHidden()
  })
});
