import { expect, test } from '@playwright/test'

test.describe('Presence Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/presence')
    await expect(page.getByTestId('presence-fixture-root')).toBeVisible()
  })

  test('PR-DOM-01 & PR-INSTANT-01: Renders child when present, removes immediately on instant close', async ({
    page,
  }) => {
    const instantBox = page.getByTestId('instant-box')
    await expect(instantBox).toBeVisible()

    await page.getByTestId('btn-toggle-instant').click()
    // Should disappear immediately in the same cycle
    await expect(instantBox).toHaveCount(0)

    // Reopen
    await page.getByTestId('btn-toggle-instant').click()
    await expect(instantBox).toBeVisible()
  })

  test('PR-TRANSITION-01: Retains closing child during CSS transition and removes after completion', async ({
    page,
  }) => {
    const transitionBox = page.getByTestId('transition-box')
    await expect(transitionBox).toBeVisible()
    await expect(transitionBox).toHaveAttribute('data-state', 'open')

    await page.getByTestId('btn-toggle-transition').click()

    // Immediately after click, it has data-state="closed" and is still in DOM during 300ms transition
    await expect(transitionBox).toHaveAttribute('data-state', 'closed')
    await expect(transitionBox).toBeVisible()

    // After transition completes, it unmounts from DOM
    await expect(transitionBox).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-ANIMATION-01: Retains closing child during CSS animation and removes after completion', async ({
    page,
  }) => {
    const animationBox = page.getByTestId('animation-box')
    await expect(animationBox).toBeVisible()
    await expect(animationBox).toHaveAttribute('data-state', 'open')

    await page.getByTestId('btn-toggle-animation').click()

    await expect(animationBox).toHaveAttribute('data-state', 'closed')
    await expect(animationBox).toBeVisible()

    await expect(animationBox).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-RACE-02: Preserves child when present returns true before exit completion', async ({
    page,
  }) => {
    const transitionBox = page.getByTestId('transition-box')
    await expect(transitionBox).toBeVisible()

    // Start exit
    await page.getByTestId('btn-toggle-transition').click()
    await expect(transitionBox).toHaveAttribute('data-state', 'closed')

    // Interrupt and reopen within 50ms
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-transition').click()

    // Should stay mounted and return to open state
    await expect(transitionBox).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(400)
    await expect(transitionBox).toBeVisible()
  })

  test('PR-NEST-01: Coordinates nested Presence instances and waits for child completion', async ({
    page,
  }) => {
    const parent = page.getByTestId('nested-parent')
    const child = page.getByTestId('nested-child')

    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    // Close parent (150ms) and child (350ms) together
    await page.getByTestId('btn-toggle-nested-parent').click()
    await page.getByTestId('btn-toggle-nested-child').click()

    // At 100ms both are still in DOM
    await page.waitForTimeout(100)
    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    // Eventually after child finishes (350ms+), both unmount
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(child).toHaveCount(0, { timeout: 2000 })
  })
})
