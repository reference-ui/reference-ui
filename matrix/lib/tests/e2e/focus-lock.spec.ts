import { expect, test } from '@playwright/test'

test.describe('FocusLock Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/focus-lock')
    await expect(page.getByTestId('focus-lock-fixture-root')).toBeVisible()
  })

  test('FL-INIT-01: Focuses the first enabled tabbable descendant on activation', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const firstBtn = page.getByTestId('lock-btn-first')
    await expect(firstBtn).toBeFocused()
  })

  test('FL-TAB-02 & FL-TAB-03: Wraps Tab on last candidate and Shift+Tab on first candidate', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const firstBtn = page.getByTestId('lock-btn-first')
    const closeBtn = page.getByTestId('btn-close-lock')

    await expect(firstBtn).toBeFocused()

    // Shift+Tab from first wraps to the last candidate (or close button/shard)
    await page.keyboard.press('Shift+Tab')
    const shardBtn = page.getByTestId('shard-button')
    // Last tabbable is shard button because it is registered in shards!
    await expect(shardBtn).toBeFocused()

    // Tab from shard button wraps back to first candidate
    await page.keyboard.press('Tab')
    await expect(firstBtn).toBeFocused()
  })

  test('FL-TRAP-01: Reclaims focus when outside focus is attempted', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()
    const firstBtn = page.getByTestId('lock-btn-first')
    await expect(firstBtn).toBeFocused()

    // Attempt to focus outside button
    await page.getByTestId('outside-button').focus()

    // Should be reclaimed back to active lock
    await expect(firstBtn).toBeFocused()
  })

  test('FL-SHARD-01: Permits focus inside registered outside shard', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const shardBtn = page.getByTestId('shard-button')
    await shardBtn.click()

    // Focus remains in shard without being reclaimed
    await expect(shardBtn).toBeFocused()
  })

  test('FL-RESTORE-01: Restores focus to the trigger element on deactivation', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-trigger')
    await trigger.click()

    await expect(page.getByTestId('lock-btn-first')).toBeFocused()

    // Close the lock
    await page.getByTestId('btn-close-lock').click()

    // Focus restored to trigger
    await expect(trigger).toBeFocused()
  })
})
