import { expect, test } from '@playwright/test'

test.describe('RovingFocus Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roving-focus')
    await expect(page.getByTestId('roving-focus-fixture-root')).toBeVisible()
  })

  test('RF-TAB-01 & RF-TAB-02: Exposes one tabIndex=0 stop and moves in/out via Tab', async ({
    page,
  }) => {
    const outsideBefore = page.getByTestId('outside-before-btn')
    const outsideAfter = page.getByTestId('outside-after-btn')
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await outsideBefore.focus()
    await expect(outsideBefore).toBeFocused()

    // Tab into composite -> lands on first enabled item (Apple)
    await page.keyboard.press('Tab')
    await expect(apple).toBeFocused()
    await expect(apple).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toHaveAttribute('tabindex', '-1')

    // Tab out of composite -> lands on outside after
    await page.keyboard.press('Tab')
    await expect(outsideAfter).toBeFocused()
  })

  test('RF-KEY-01 & RF-KEY-07: Moves between enabled items and skips disabled items', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // ArrowRight -> skips disabled Banana -> focuses Blueberry
    await page.keyboard.press('ArrowRight')
    await expect(blueberry).toBeFocused()
    await expect(blueberry).toHaveAttribute('tabindex', '0')
    await expect(apple).toHaveAttribute('tabindex', '-1')

    // ArrowRight -> focuses Cherry
    await page.keyboard.press('ArrowRight')
    await expect(cherry).toBeFocused()
  })

  test('RF-KEY-06: Loops around boundary when loop=true', async ({ page }) => {
    const apple = page.getByTestId('item-apple')
    const cherry = page.getByTestId('item-cherry')

    await cherry.focus()
    await expect(cherry).toBeFocused()

    // ArrowRight on last item -> wraps to first enabled item (Apple)
    await page.keyboard.press('ArrowRight')
    await expect(apple).toBeFocused()

    // ArrowLeft on first item -> wraps to last enabled item (Cherry)
    await page.keyboard.press('ArrowLeft')
    await expect(cherry).toBeFocused()
  })

  test('RF-KEY-04: Home and End navigate to first and last enabled items', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()

    await page.keyboard.press('Home')
    await expect(apple).toBeFocused()

    await page.keyboard.press('End')
    await expect(cherry).toBeFocused()
  })

  test('RF-TYPE-02 & RF-TYPE-03: Typeahead matches item prefix and moves focus', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // Type 'bl' -> matches Blueberry
    await page.keyboard.press('b')
    await page.keyboard.press('l')

    await expect(blueberry).toBeFocused()
  })
})
