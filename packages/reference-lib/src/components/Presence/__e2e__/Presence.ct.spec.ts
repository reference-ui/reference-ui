import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Presence', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceFixture')
  })

  test('PR-DOM-01 & PR-INSTANT-01: Renders child when present, removes immediately on instant close', async ({
    page,
  }) => {
    const instantBox = page.getByTestId('instant-box')
    await expect(instantBox).toBeVisible()
    await snap(page, 'initial-all-open')

    await page.getByTestId('btn-toggle-instant').click()
    // Should disappear immediately in the same cycle
    await expect(instantBox).toHaveCount(0)
    await snap(page, 'instant-removed')

    // Reopen
    await page.getByTestId('btn-toggle-instant').click()
    await expect(instantBox).toBeVisible()
    await snap(page, 'instant-reopened')
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
    await snap(page, 'transition-closing')

    // After transition completes, it unmounts from DOM
    await expect(transitionBox).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'transition-removed')
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
    await snap(page, 'animation-closing')

    await expect(animationBox).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'animation-removed')
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
    await snap(page, 'transition-interrupted-reopened')
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
    await snap(page, 'nested-closing')

    // Eventually after child finishes (350ms+), both unmount
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(child).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'nested-removed')
  })

  test('PR-NEST-05: Exits a parent with an animated exit when a nested Presence was born closed', async ({
    mount,
    page,
  }) => {
    await mount('components/Presence/Presence/PresenceNestedBornClosedFixture')
    const parent = page.getByTestId('bornclosed-parent')

    await expect(parent).toBeVisible()
    await expect(page.getByTestId('bornclosed-child')).toHaveCount(0)

    await page.getByTestId('btn-toggle-bornclosed-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')

    // The never-opened nested child must not strand the 150ms parent exit.
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'bornclosed-removed')
  })

  test('PR-NEST-06: Coordinates a nested child that opens and closes during the parent exit', async ({
    mount,
    page,
  }) => {
    await mount('components/Presence/Presence/PresenceNestedBornClosedFixture')
    const parent = page.getByTestId('bornclosed-parent')
    const child = page.getByTestId('bornclosed-child')

    await expect(parent).toBeVisible()

    // Start the parent exit, then open and close the born-closed child mid-exit.
    await page.getByTestId('btn-toggle-bornclosed-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await page.getByTestId('btn-toggle-bornclosed-child').click()
    await expect(child).toBeVisible()
    await page.getByTestId('btn-toggle-bornclosed-child').click()
    await expect(child).toHaveAttribute('data-state', 'closed')

    // Both settle once the longer child exit completes.
    await expect(parent).toHaveCount(0, { timeout: 3000 })
    await expect(child).toHaveCount(0, { timeout: 3000 })
    await snap(page, 'bornclosed-coordinated-removed')
  })
})

test.describe('Presence onExitComplete (W-09)', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceExitCompleteFixture')
  })

  test('PR-EXIT-01: Fires onExitComplete exactly once after a completed transition exit', async ({
    page,
  }) => {
    const box = page.getByTestId('exit-transition-box')
    const count = page.getByTestId('exitcount-transition')
    await expect(box).toBeVisible()
    await expect(count).toHaveText('0')

    await page.getByTestId('btn-toggle-exit-transition').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')

    // No second fire from trailing end events.
    await page.waitForTimeout(600)
    await expect(count).toHaveText('1')
  })

  test('PR-EXIT-02: Fires onExitComplete for instant exits', async ({ page }) => {
    const box = page.getByTestId('exit-instant-box')
    const count = page.getByTestId('exitcount-instant')
    await expect(box).toBeVisible()

    await page.getByTestId('btn-toggle-exit-instant').click()
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('1')
  })

  test('PR-EXIT-03: Does not fire onExitComplete on interrupted exits', async ({
    page,
  }) => {
    const box = page.getByTestId('exit-interrupt-box')
    const count = page.getByTestId('exitcount-interrupt')
    await expect(box).toBeVisible()

    await page.getByTestId('btn-toggle-exit-interrupt').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-exit-interrupt').click()

    await expect(box).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(500)
    await expect(box).toBeVisible()
    await expect(count).toHaveText('0')

    // The next completed exit still fires exactly once.
    await page.getByTestId('btn-toggle-exit-interrupt').click()
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')
  })

  test('PR-EXIT-04: Does not fire onExitComplete on initial mount', async ({
    page,
  }) => {
    for (const id of [
      'exitcount-transition',
      'exitcount-instant',
      'exitcount-interrupt',
      'exitcount-wedge-parent',
      'exitcount-wedge-child',
      'exitcount-coord-parent',
      'exitcount-coord-child',
    ]) {
      await expect(page.getByTestId(id)).toHaveText('0')
    }
  })

  test('PR-EXIT-05: Fires through the born-closed nested wedge (B-01 overlay shape)', async ({
    page,
  }) => {
    const parent = page.getByTestId('exit-wedge-parent')
    const parentCount = page.getByTestId('exitcount-wedge-parent')
    const childCount = page.getByTestId('exitcount-wedge-child')

    await expect(parent).toBeVisible()
    await expect(page.getByTestId('exit-wedge-child')).toHaveCount(0)

    await page.getByTestId('btn-toggle-exit-wedge-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')
  })

  test('PR-EXIT-06: Fires once per Presence when nested parent and child exit together', async ({
    page,
  }) => {
    const parent = page.getByTestId('exit-coord-parent')
    const child = page.getByTestId('exit-coord-child')
    const parentCount = page.getByTestId('exitcount-coord-parent')
    const childCount = page.getByTestId('exitcount-coord-child')

    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    await page.getByTestId('btn-toggle-exit-coord-parent').click()
    await page.getByTestId('btn-toggle-exit-coord-child').click()

    await expect(parent).toHaveCount(0, { timeout: 3000 })
    await expect(child).toHaveCount(0, { timeout: 3000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('1')
  })
})
