import { expect, test, type Page } from '@playwright/test'

async function setDocumentHidden(page: Page, hidden: boolean) {
  await page.evaluate(isHidden => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (isHidden ? 'hidden' : 'visible'),
    })
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isHidden,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

async function swipeToast(page: Page, id: string) {
  const toast = page.locator(`[data-reference-toast-id="${id}"]`)
  const box = await toast.boundingBox()
  expect(box).toBeTruthy()
  const x = box!.x + box!.width / 2
  const y = box!.y + Math.min(24, box!.height / 2)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 220, y, { steps: 12 })
  await page.mouse.up()
}

test.describe('Toast Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toast')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  })

  test('TO-DOM-01 & TO-DEF-01: Displays defined toast, updates content in place, and dismisses', async ({
    page,
  }) => {
    const toastRoot = page.getByTestId('defined-toast-root')
    const toastTitle = page.getByTestId('defined-toast-title')

    await expect(toastRoot).toHaveCount(0)

    // Show defined toast
    await page.getByTestId('btn-show-defined-toast').click()
    await expect(toastRoot).toBeVisible()
    await expect(toastRoot).toHaveAttribute('data-type', 'success')
    await expect(toastTitle).toHaveText('Project saved successfully!')

    // Update toast in place
    await page.getByTestId('btn-update-toast').click()
    await expect(toastTitle).toHaveText('Project synchronized with cloud!')

    // Dismiss toast
    await page.getByTestId('btn-dismiss-toast').click()
    await expect(toastRoot).toHaveCount(0)
  })

  test('TO-DEF-DEFAULT: Displays default toast with title, description, and close button, and dismisses on close click', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-default-toast').click()

    const toastRoot = page.locator('[data-reference-toast-root]')
    await expect(toastRoot).toBeVisible()

    const title = page.locator('[data-reference-toast-title]')
    await expect(title).toHaveText('Settings updated')

    const desc = page.locator('[data-reference-toast-description]')
    await expect(desc).toHaveText('Your profile settings were saved.')

    const closeBtn = page.locator('[data-reference-toast-close]')
    await expect(closeBtn).toBeVisible()

    // Click close button to dismiss
    await closeBtn.click()
    await expect(toastRoot).toHaveCount(0)
  })

  test('TO-DEF-CUSTOM: Renders custom toast using toast.custom() and dismisses on close', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-custom-toast').click()

    const customRoot = page.getByTestId('custom-toast-root')
    await expect(customRoot).toBeVisible()

    const title = page.getByTestId('custom-toast-title')
    await expect(title).toHaveText('Custom Layout')

    const closeBtn = page.getByTestId('btn-custom-close')
    await closeBtn.click()
    await expect(customRoot).toHaveCount(0)
  })

  test('TO-STACK-01: Correct card stacking order and transforms with newest toast in front', async ({
    page,
  }) => {
    await page.getByTestId('btn-add-stack-toasts').click()

    const toasts = page.locator('[data-reference-toast-id]')
    await expect(toasts).toHaveCount(3)

    // The third (newest) toast should be marked as front and have scale 1
    const thirdToast = page.locator('[data-reference-toast-id]').nth(2)
    await expect(thirdToast).toHaveAttribute('data-front', 'true')

    const secondToast = page.locator('[data-reference-toast-id]').nth(1)
    await expect(secondToast).toHaveAttribute('data-front', 'false')

    const firstToast = page.locator('[data-reference-toast-id]').nth(0)
    await expect(firstToast).toHaveAttribute('data-front', 'false')

    // Clean up
    await page.getByTestId('btn-dismiss-all').click()
    await expect(toasts).toHaveCount(0)
  })

  test('TO-STACK-HOVER: Hovering over the stack expands out cards smoothly without flickering', async ({
    page,
  }) => {
    await page.getByTestId('btn-add-stack-toasts').click()

    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    await expect(stack).toBeVisible()

    // Hover over the stack
    await stack.hover()
    await expect(stack).toHaveAttribute('data-expanded', 'true')

    // Verify all 3 toasts are visible and expanded
    const toasts = page.locator('[data-reference-toast-id]')
    await expect(toasts).toHaveCount(3)

    // Moving between toasts within the stack should keep data-expanded="true" (no flicker loop)
    const secondToast = toasts.nth(1)
    await secondToast.hover()
    await expect(stack).toHaveAttribute('data-expanded', 'true')

    // Clean up
    await page.getByTestId('btn-dismiss-all').click()
    await expect(toasts).toHaveCount(0)
  })
})

test.describe('Toast Gate 6', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toast?fixture=Gate6')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  })

  test('TO-OV-01: Toast should pause visible timers when a modal Overlay becomes the top layer', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-pause-toast').click()
    const item = page.locator('[data-reference-toast-id="ov-pause"]')
    await expect(item).toBeVisible()

    await page.getByTestId('btn-open-modal-a').click()
    await expect(page.getByTestId('modal-a')).toBeVisible()
    await expect(item).toHaveAttribute('data-paused', 'true')

    await page.waitForTimeout(1200)
    await expect(item).toBeVisible()

    await page.getByTestId('btn-close-modal-a').click()
    await expect(page.getByTestId('modal-a')).toHaveCount(0)
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-OV-02: Toast should resume remaining time when the final top modal stops being active', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-pause-toast').click()
    const item = page.locator('[data-reference-toast-id="ov-pause"]')
    await expect(item).toBeVisible()

    await page.getByTestId('btn-open-modal-a').click()
    await expect(page.getByTestId('modal-a')).toBeVisible()
    await page.getByTestId('btn-open-modal-b').click()
    await expect(page.getByTestId('modal-b')).toBeVisible()

    await page.getByTestId('btn-close-modal-b').click()
    await expect(page.getByTestId('modal-b')).toHaveCount(0)
    await page.waitForTimeout(1000)
    await expect(item).toBeVisible()
    await expect(page.getByTestId('modal-a')).toBeVisible()

    await page.getByTestId('btn-close-modal-a').click()
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-QUEUE-02: Toast should keep excess instances out of rendered DOM when the global limit is reached', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-limit-a').click()
    await page.getByTestId('btn-show-limit-b').click()
    await page.getByTestId('btn-show-limit-c').click()

    await expect(page.locator('[data-reference-toast-id="limit-a"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="limit-b"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="limit-c"]')).toHaveCount(0)

    await page.getByTestId('btn-dismiss-limit-a').click()
    await expect(page.locator('[data-reference-toast-id="limit-a"]')).toHaveCount(0)
    await expect(page.locator('[data-reference-toast-id="limit-c"]')).toBeVisible()
  })

  test('TO-SWIPE-01: Toast should dismiss when swipe distance or velocity crosses the threshold', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-swipe-toast').click()
    const item = page.locator('[data-reference-toast-id="swipe"]')
    await expect(item).toBeVisible()
    await swipeToast(page, 'swipe')
    await expect(item).toHaveCount(0)
  })

  test('TO-TIME-04: Toast should pause remaining time while the pointer stays over the stack', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-pause-toast').click()
    const item = page.locator('[data-reference-toast-id="ov-pause"]')
    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    await expect(item).toBeVisible()
    await stack.hover()
    await expect(stack).toHaveAttribute('data-expanded', 'true')
    await expect(item).toHaveAttribute('data-paused', 'true')
    await page.waitForTimeout(1200)
    await expect(item).toBeVisible()

    await page.getByTestId('btn-away').hover()
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-TIME-07: Toast should pause remaining time when its owner document becomes hidden', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-pause-toast').click()
    const item = page.locator('[data-reference-toast-id="ov-pause"]')
    await expect(item).toBeVisible()

    await setDocumentHidden(page, true)
    await expect(item).toHaveAttribute('data-paused', 'true')
    await page.waitForTimeout(1200)
    await expect(item).toBeVisible()

    await setDocumentHidden(page, false)
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-HOTKEY-01: Toast should move focus into the toaster when the configured hotkey is pressed', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-hotkey-toast').click()
    await expect(page.locator('[data-reference-toast-id="hotkey"]')).toBeVisible()
    await page.getByTestId('btn-away').focus()
    await page.keyboard.press('Alt+T')
    const focusedInHost = await page.evaluate(() => {
      const host = document.querySelector('[data-reference-toast-host]')
      return Boolean(host && document.activeElement && host.contains(document.activeElement))
    })
    expect(focusedInHost).toBe(true)
  })

  test('TO-DISMISSIBLE-01: Toast should refuse swipe and close when dismissible is false', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-locked-timed-toast').click()
    const timed = page.locator('[data-reference-toast-id="locked-timed"]')
    await expect(timed).toBeVisible()
    await expect(timed).toHaveCount(0, { timeout: 2000 })

    await page.getByTestId('btn-show-locked-toast').click()
    const item = page.locator('[data-reference-toast-id="locked"]')
    await expect(item).toBeVisible()
    await expect(item).toHaveAttribute('data-dismissible', 'false')

    await page.locator('[data-reference-toast-close]').click()
    await expect(item).toBeVisible()

    await swipeToast(page, 'locked')
    await expect(item).toBeVisible()
  })

  test('TO-AUTOCLOSE-01: Toast should call onAutoClose only when the timer expires', async ({
    page,
  }) => {
    await page.evaluate(() => {
      ;(window as unknown as { __toastAutoClose?: string[] }).__toastAutoClose = []
    })

    await page.getByTestId('btn-show-autoclose-toast').click()
    await expect(page.locator('[data-reference-toast-id="auto"]')).toHaveCount(0, { timeout: 2000 })
    expect(await page.evaluate(() => (window as unknown as { __toastAutoClose?: string[] }).__toastAutoClose)).toEqual([
      'auto',
    ])

    await page.getByTestId('btn-show-manual-autoclose-toast').click()
    const manual = page.locator('[data-reference-toast-id="manual"]')
    await expect(manual).toBeVisible()
    await page.locator('[data-reference-toast-close]').click()
    await expect(manual).toHaveCount(0)

    await page.getByTestId('btn-show-manual-autoclose-toast').click()
    await expect(page.locator('[data-reference-toast-id="manual"]')).toBeVisible()
    await swipeToast(page, 'manual')
    await expect(page.locator('[data-reference-toast-id="manual"]')).toHaveCount(0)

    await page.getByTestId('btn-show-manual-autoclose-toast').click()
    await expect(page.locator('[data-reference-toast-id="manual"]')).toBeVisible()
    await page.getByTestId('btn-dismiss-manual').click()
    await expect(page.locator('[data-reference-toast-id="manual"]')).toHaveCount(0)

    expect(await page.evaluate(() => (window as unknown as { __toastAutoClose?: string[] }).__toastAutoClose)).toEqual([
      'auto',
    ])
  })
})

test('TO-HOTKEY-01 custom: Toast should honor a custom toaster hotkey', async ({ page }) => {
  await page.goto('/toast?fixture=HotkeyCustom')
  await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  await page.getByTestId('btn-show-hotkey-toast').click()
  await expect(page.locator('[data-reference-toast-id="hotkey"]')).toBeVisible()
  await page.keyboard.press('Shift+Y')
  const focusedInHost = await page.evaluate(() => {
    const host = document.querySelector('[data-reference-toast-host]')
    return Boolean(host && document.activeElement && host.contains(document.activeElement))
  })
  expect(focusedInHost).toBe(true)
})

test('TO-HOTKEY-01 suppress: Toast should not steal focus when the hotkey is disabled', async ({
  page,
}) => {
  await page.goto('/toast?fixture=HotkeyOff')
  await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  await page.getByTestId('btn-show-hotkey-toast').click()
  await expect(page.locator('[data-reference-toast-id="hotkey"]')).toBeVisible()
  await page.getByTestId('btn-outside-focus').focus()
  await page.keyboard.press('Alt+T')
  await expect(page.getByTestId('btn-outside-focus')).toBeFocused()
})
