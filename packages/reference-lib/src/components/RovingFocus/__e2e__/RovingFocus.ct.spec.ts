import { test, expect, snap } from '../../../../playwright/ct'

test.describe('RovingFocus Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusFixture')
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
    await snap(page, 'outside-before-focused')

    // Tab into composite -> lands on first enabled item (Apple)
    await page.keyboard.press('Tab')
    await expect(apple).toBeFocused()
    await expect(apple).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toHaveAttribute('tabindex', '-1')
    await snap(page, 'item-apple-focused')

    // Tab out of composite -> lands on outside after
    await page.keyboard.press('Tab')
    await expect(outsideAfter).toBeFocused()
    await snap(page, 'outside-after-focused')
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
    await snap(page, 'item-blueberry-focused')

    // ArrowRight -> focuses Cherry
    await page.keyboard.press('ArrowRight')
    await expect(cherry).toBeFocused()
    await snap(page, 'item-cherry-focused')
  })

  test('RF-KEY-06: Loops around boundary when loop=true', async ({ page }) => {
    const apple = page.getByTestId('item-apple')
    const cherry = page.getByTestId('item-cherry')

    await cherry.focus()
    await expect(cherry).toBeFocused()

    // ArrowRight on last item -> wraps to first enabled item (Apple)
    await page.keyboard.press('ArrowRight')
    await expect(apple).toBeFocused()
    await snap(page, 'looped-forward-apple-focused')

    // ArrowLeft on first item -> wraps to last enabled item (Cherry)
    await page.keyboard.press('ArrowLeft')
    await expect(cherry).toBeFocused()
    await snap(page, 'looped-backward-cherry-focused')
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
    await snap(page, 'home-key-apple-focused')

    await page.keyboard.press('End')
    await expect(cherry).toBeFocused()
    await snap(page, 'end-key-cherry-focused')
  })

  test('RF-TAB-04: Pointer press sets current without stealing focus; Tab re-enters on pressed item', async ({
    page,
  }) => {
    const outsideAfter = page.getByTestId('outside-after-btn')
    const apple = page.getByTestId('item-apple')
    const banana = page.getByTestId('item-banana')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // Real click: browser moves focus AND currentness follows.
    await cherry.click()
    await expect(cherry).toBeFocused()
    await expect(cherry).toHaveAttribute('tabindex', '0')
    await expect(apple).toHaveAttribute('tabindex', '-1')

    // Pointer press that never moves DOM focus (touch / Safari-tap shape):
    // currentness-only, focus stays where it was.
    await blueberry.dispatchEvent('pointerdown')
    await expect(blueberry).toHaveAttribute('tabindex', '0')
    await expect(cherry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toBeFocused()

    // Disabled items never become current via press.
    await banana.dispatchEvent('pointerdown')
    await expect(banana).toHaveAttribute('tabindex', '-1')
    await expect(blueberry).toHaveAttribute('tabindex', '0')

    // Non-primary presses (right-click) never move the stop.
    await apple.dispatchEvent('pointerdown', { button: 2 })
    await expect(apple).toHaveAttribute('tabindex', '-1')
    await expect(blueberry).toHaveAttribute('tabindex', '0')

    // Tab out of the composite, then back in: re-entry lands on the pressed item.
    await page.keyboard.press('Tab')
    await expect(outsideAfter).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(blueberry).toBeFocused()
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
    await snap(page, 'typeahead-blueberry-focused')
  })
})

test.describe('RovingFocus Space typeahead guard (PATCHES #1)', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSpaceFixture')
    await expect(page.getByTestId('roving-focus-space-root')).toBeVisible()
  })

  test('RF-TYPE-06: Space with a nonempty buffer matches a space-containing label and activates nothing', async ({
    page,
  }) => {
    const blueberry = page.getByTestId('space-blueberry')
    const blueBerry = page.getByTestId('space-blue-berry')
    const count = page.getByTestId('space-activation-count')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()
    await expect(count).toHaveText('0')

    // "blue" still prefixes the current item, so focus holds through here.
    for (const ch of ['b', 'l', 'u', 'e']) {
      await page.keyboard.press(ch)
    }
    await expect(blueberry).toBeFocused()

    // Space continues the search: buffer "blue " matches "Blue Berry" only.
    await page.keyboard.press('Space')
    await expect(blueBerry).toBeFocused()
    await expect(blueBerry).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')

    // Neither the original nor the matched button activated. Settle first:
    // a late native click must fail this, not slip past an instant assert.
    await page.waitForTimeout(200)
    await expect(count).toHaveText('0')
  })

  test('RF-TYPE-06 complement: Space with an empty buffer keeps native button activation', async ({
    page,
  }) => {
    const blueberry = page.getByTestId('space-blueberry')
    const count = page.getByTestId('space-activation-count')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()

    // No buffer: Space is not typeahead input — the button activates natively.
    await page.keyboard.press('Space')
    await expect(count).toHaveText('1')
    await expect(blueberry).toBeFocused()
  })
})
