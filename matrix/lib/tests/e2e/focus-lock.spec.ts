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

  test('FL-TAB-01 & FL-CAND-01 & FL-CAND-04 & FL-CAND-05 & FL-CAND-06: catalog visits native tabbables and native exclusions', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-catalog').click()
    await expect(page.getByTestId('catalog-btn')).toBeFocused()

    const order: string[] = []
    for (let i = 0; i < 12; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      if (id) order.push(id)
      await page.keyboard.press('Tab')
      if (id === 'catalog-btn' && i > 0) break
    }

    expect(order).toContain('catalog-btn')
    expect(order).toContain('catalog-input')
    expect(order).toContain('catalog-select')
    expect(order).toContain('catalog-textarea')
    expect(order).toContain('catalog-link')
    expect(order).toContain('catalog-legend-btn')
    expect(order).toContain('catalog-radio-b')
    expect(order).toContain('catalog-summary')
    expect(order).not.toContain('catalog-fieldset-body')
    expect(order).not.toContain('catalog-radio-a')
    expect(order).not.toContain('catalog-details-inner')
    expect(order).not.toContain('catalog-disabled')
  })

  test('FL-CAND-08: Tab order includes open shadow descendants', async ({ page }) => {
    await page.getByTestId('btn-open-shadow').click()
    await expect(page.getByTestId('shadow-before')).toBeFocused()
    await expect(page.getByTestId('shadow-inner-button')).toBeVisible()
    await page.keyboard.press('Tab')
    const inner = page.getByTestId('shadow-inner-button')
    await expect(inner).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shadow-after')).toBeFocused()
  })

  test('FL-NEST-01 & FL-NEST-02 & FL-NEST-03: nested standalone locks pause and resume', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()
    await expect(page.getByTestId('lock-btn-first')).toBeFocused()
    await page.getByTestId('btn-open-inner-lock').click()
    await expect(page.getByTestId('inner-lock-first')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('inner-lock-last')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('btn-close-inner-lock')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('inner-lock-first')).toBeFocused()

    await page.getByTestId('lock-btn-first').evaluate((el: HTMLElement) => el.focus())
    const innerHasFocus = await page.evaluate(() => {
      const inner = document.querySelector('[data-testid="inner-lock-container"]')
      return Boolean(inner?.contains(document.activeElement))
    })
    expect(innerHasFocus).toBe(true)

    await page.getByTestId('btn-close-inner-lock').click()
    await expect(page.getByTestId('inner-lock-container')).toHaveCount(0)
    const outerHasFocus = await page.evaluate(() => {
      const outer = document.querySelector('[data-testid="focus-lock-container"]')
      return Boolean(outer?.contains(document.activeElement))
    })
    expect(outerHasFocus).toBe(true)
  })

  test('FL-RESTORE-03: restores to the right sibling when the opener is removed', async ({
    page,
  }) => {
    await page.getByTestId('btn-proximity-opener').click()
    await expect(page.getByTestId('proximity-lock')).toBeVisible()
    await page.getByTestId('btn-remove-opener-close').click()
    await expect(page.getByTestId('proximity-lock')).toHaveCount(0)
    await expect(page.getByTestId('btn-proximity-opener')).toHaveCount(0)
    await expect(page.getByTestId('btn-proximity-right')).toBeFocused()
  })

  test('FL-RESTORE-01: Restores focus to the trigger element on deactivation', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-trigger')
    await trigger.click()

    await expect(page.getByTestId('lock-btn-first')).toBeFocused()
    await page.getByTestId('btn-close-lock').click()
    await expect(trigger).toBeFocused()
  })
})
