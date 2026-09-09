import { expect, test } from '@playwright/test'

test.describe('FocusLock × Overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overlay/focus')
    await expect(page.getByTestId('focus-lock-overlay-root')).toBeVisible()
  })

  test('FL-OV-01: FocusLock keeps trapping while Overlay Content is closed-but-mounted', async ({
    page,
  }) => {
    const trigger = page.getByTestId('fl-ov-01-trigger')
    await trigger.click()
    const content = page.getByTestId('fl-ov-01-content')
    await expect(content).toBeVisible()
    await expect(page.getByTestId('fl-ov-01-first')).toBeFocused()

    await page.getByTestId('fl-ov-01-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(content).toBeVisible()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-background"]')?.focus()
    })
    const duringExit = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(['fl-ov-01-first', 'fl-ov-01-second', 'fl-ov-01-close', 'fl-ov-01-content']).toContain(
      duringExit
    )

    await page.keyboard.press('Tab')
    const afterTab = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(afterTab).not.toBe('fl-ov-background')
    expect(afterTab).not.toBe('fl-ov-01-trigger')

    await expect(content).toHaveCount(0)
  })

  test('FL-OV-02 & FL-RESTORE-02 & FL-RESTORE-08: one restore after Presence, skip, explicit target', async ({
    page,
  }) => {
    const trigger = page.getByTestId('fl-ov-01-trigger')
    await trigger.click()
    const content = page.getByTestId('fl-ov-01-content')
    await expect(page.getByTestId('fl-ov-01-first')).toBeFocused()
    await page.evaluate(() => {
      ;(window as unknown as { __flRestore: number }).__flRestore = 0
      const triggerEl = document.querySelector('[data-testid="fl-ov-01-trigger"]')
      triggerEl?.addEventListener('focus', () => {
        const contentEl = document.querySelector('[data-testid="fl-ov-01-content"]')
        if (!contentEl || contentEl.getAttribute('data-state') === 'closed') {
          ;(window as unknown as { __flRestore: number }).__flRestore += 1
        }
      })
    })

    await page.getByTestId('fl-ov-01-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(trigger).not.toBeFocused()
    await expect(content).toHaveCount(0)
    await expect(trigger).toBeFocused()
    const restoreCount = await page.evaluate(
      () => (window as unknown as { __flRestore: number }).__flRestore
    )
    expect(restoreCount).toBe(1)

    await page.getByTestId('fl-ov-skip-trigger').click()
    await expect(page.getByTestId('fl-ov-skip-content')).toBeVisible()
    await page.getByTestId('fl-ov-skip-close').click()
    await expect(page.getByTestId('fl-ov-skip-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-skip-trigger')).not.toBeFocused()
    await page.getByTestId('fl-ov-background').focus()
    await expect(page.getByTestId('fl-ov-background')).toBeFocused()
    await expect(page.getByTestId('fl-ov-skip-trigger')).not.toBeFocused()

    await page.getByTestId('fl-ov-explicit-trigger').click()
    await expect(page.getByTestId('fl-ov-explicit-content')).toBeVisible()
    await page.getByTestId('fl-ov-explicit-close').click()
    await expect(page.getByTestId('fl-ov-explicit-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-explicit-target')).toBeFocused()
    await expect(page.getByTestId('fl-ov-explicit-trigger')).not.toBeFocused()
  })

  test('FL-OV-05 & FL-RESTORE-03 & FL-RESTORE-04 & FL-RESTORE-05: proximity walk after Presence', async ({
    page,
  }) => {
    await page.getByTestId('fl-ov-right-opener').click()
    await expect(page.getByTestId('fl-ov-right-content')).toBeVisible()
    await page.getByTestId('fl-ov-right-remove-close').click()
    await expect(page.getByTestId('fl-ov-right-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-right-opener')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-right-sibling')).toBeFocused()

    await page.getByTestId('fl-ov-left-opener').click()
    await expect(page.getByTestId('fl-ov-left-content')).toBeVisible()
    await page.getByTestId('fl-ov-left-remove-close').click()
    await expect(page.getByTestId('fl-ov-left-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-left-opener')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-left-sibling')).toBeFocused()

    await page.getByTestId('fl-ov-ancestor-opener').click()
    await expect(page.getByTestId('fl-ov-ancestor-content')).toBeVisible()
    await page.getByTestId('fl-ov-ancestor-remove-close').click()
    await expect(page.getByTestId('fl-ov-ancestor-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-ancestor-opener')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-ancestor')).toBeFocused()

    await page.getByTestId('fl-ov-disabled-opener').click()
    await expect(page.getByTestId('fl-ov-disabled-content')).toBeVisible()
    await page.getByTestId('fl-ov-disabled-close').click()
    await expect(page.getByTestId('fl-ov-disabled-content')).toHaveCount(0)
    await expect(page.getByTestId('fl-ov-disabled-opener')).toBeDisabled()
    await expect(page.getByTestId('fl-ov-disabled-sibling')).toBeFocused()
  })

  test('FL-OV-03 & FL-NEST-01 & FL-NEST-02 & FL-NEST-03: nested isolating Overlay pauses parent lock', async ({
    page,
  }) => {
    await page.getByTestId('fl-ov-nest-open-parent').click()
    await expect(page.getByTestId('fl-ov-nest-parent-1')).toBeFocused()

    await page.getByTestId('fl-ov-nest-open-child').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('fl-ov-nest-child-1')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-nest-child-2')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-nest-child-close')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-nest-child-1')).toBeFocused()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-nest-parent-1"]')?.focus()
    })
    const childReclaim = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(['fl-ov-nest-child-1', 'fl-ov-nest-child-2', 'fl-ov-nest-child-close']).toContain(
      childReclaim
    )

    await page.getByTestId('fl-ov-nest-child-close').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('fl-ov-nest-child-content')).toHaveCount(0)
    const parentHasFocus = await page.evaluate(() => {
      const parent = document.querySelector('[data-testid="fl-ov-nest-parent-content"]')
      return Boolean(parent?.contains(document.activeElement))
    })
    expect(parentHasFocus).toBe(true)

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-background"]')?.focus()
    })
    const parentReclaim = await page.evaluate(() => {
      const parent = document.querySelector('[data-testid="fl-ov-nest-parent-content"]')
      return Boolean(parent?.contains(document.activeElement))
    })
    expect(parentReclaim).toBe(true)
  })

  test('FL-OV-04 & FL-NEST-05 & FL-SHARD-03: modeless Overlay.Content is a shard of the parent lock', async ({
    page,
  }) => {
    await page.getByTestId('fl-ov-shard-open-parent').click()
    await expect(page.getByTestId('fl-ov-shard-parent-1')).toBeFocused()

    await page.getByTestId('fl-ov-shard-open-child').evaluate((el: HTMLElement) => el.click())
    const child = page.getByTestId('fl-ov-shard-child-content')
    await expect(child).toBeVisible()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-shard-child-1"]')?.focus()
    })
    await expect(page.getByTestId('fl-ov-shard-child-1')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('fl-ov-shard-child-2')).toBeFocused()

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-shard-unregistered"]')?.focus()
    })
    const afterEscape = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(afterEscape).not.toBe('fl-ov-shard-unregistered')
    expect(afterEscape).not.toBe('fl-ov-background')

    await page.getByTestId('fl-ov-shard-child-close').evaluate((el: HTMLElement) => el.click())
    await expect(child).toHaveCount(0)
    const parentStillLocked = await page.evaluate(() => {
      const parent = document.querySelector('[data-testid="fl-ov-shard-parent-content"]')
      return Boolean(parent?.contains(document.activeElement))
    })
    expect(parentStillLocked).toBe(true)

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="fl-ov-shard-unregistered"]')?.focus()
    })
    const stillParent = await page.evaluate(() => {
      const parent = document.querySelector('[data-testid="fl-ov-shard-parent-content"]')
      return Boolean(parent?.contains(document.activeElement))
    })
    expect(stillParent).toBe(true)
  })
})
