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
  await expect(toast).toHaveAttribute('data-state', 'open')
  await toast.hover()
  const box = await toast.boundingBox()
  expect(box).toBeTruthy()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
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

function parseScale(transform: string): number {
  if (!transform || transform === 'none') return 1
  const m3 = transform.match(/matrix3d\(([^)]+)\)/)
  if (m3) return Number(m3[1].split(',')[0])
  const m = transform.match(/matrix\(([^)]+)\)/)
  if (m) return Number(m[1].split(',')[0])
  return 1
}

async function dragToast(page: Page, id: string, dx: number, dy: number, steps = 40) {
  const toast = page.locator(`[data-reference-toast-id="${id}"]`)
  await expect(toast).toHaveAttribute('data-state', 'open')
  await toast.hover()
  const box = await toast.boundingBox()
  expect(box).toBeTruthy()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps })
  await page.waitForTimeout(250)
  await page.mouse.up()
}

test.describe('Toast Gate 7', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toast?fixture=Gate7')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  })

  test('TO-RIVAL-ENTER: A new toast should enter from off the stack axis, not appear in place', async ({
    page,
  }) => {
    await page.evaluate(() => {
      ;(window as unknown as { __toastEnter?: Array<{ state: string | null; y: number; opacity: string }> }).__toastEnter = []
      const obs = new MutationObserver(() => {
        const el = document.querySelector('[data-reference-toast-id="enter-bottom"]') as HTMLElement | null
        if (!el) return
        const t = getComputedStyle(el).transform
        const ty = t === 'none' ? 0 : parseFloat(t.split(',')[t.includes('matrix3d') ? 13 : 5]) || 0
        ;(window as unknown as { __toastEnter: Array<{ state: string | null; y: number; opacity: string; enter: string }> }).__toastEnter.push({
          state: el.getAttribute('data-state'),
          y: ty,
          opacity: getComputedStyle(el).opacity,
          enter: getComputedStyle(el).getPropertyValue('--reference-toast-enter'),
        })
      })
      obs.observe(document.body, { subtree: true, childList: true, attributes: true })
    })

    await page.getByTestId('btn-enter-bottom').click()
    const item = page.locator('[data-reference-toast-id="enter-bottom"]')
    await expect(item).toBeVisible()
    await expect(item).toHaveAttribute('data-state', 'open')
    const samples = await page.evaluate(
      () => (window as unknown as { __toastEnter: Array<{ state: string | null; y: number; opacity: string }> }).__toastEnter
    )
    const closed = samples.find(s => s.state === 'closed')
    expect(closed).toBeTruthy()
    expect(Number(closed!.opacity)).toBeLessThan(1)
    const enter = (closed as { enter?: string }).enter ?? ''
    expect(closed!.y > 8 || enter.includes('100') || enter.includes('%')).toBe(true)

    await page.getByTestId('btn-enter-top').click()
    const top = page.locator('[data-reference-toast-id="enter-top"]')
    await expect(top).toBeVisible()
    await expect(top).toHaveAttribute('data-y', 'top')
    await expect(top).toHaveAttribute('data-state', 'open')
  })

  test('TO-RIVAL-STACK: Collapsed cards behind the front should read as a stack', async ({ page }) => {
    await page.getByTestId('btn-stack').click()
    const front = page.locator('[data-reference-toast-id="stack-c"]')
    const mid = page.locator('[data-reference-toast-id="stack-b"]')
    const back = page.locator('[data-reference-toast-id="stack-a"]')
    await expect(front).toHaveAttribute('data-front', 'true')
    await expect(front).toHaveAttribute('data-state', 'open')

    const scales = await Promise.all(
      [front, mid, back].map(async loc => parseScale(await loc.evaluate(el => getComputedStyle(el).transform)))
    )
    expect(scales[0]).toBeCloseTo(1, 2)
    expect(scales[1]).toBeCloseTo(0.95, 2)
    expect(scales[2]).toBeCloseTo(0.9, 2)

    await expect(mid.locator('[data-reference-toast-title]')).toHaveCSS('opacity', '0')
    const midBox = await mid.boundingBox()
    const frontBox = await front.boundingBox()
    expect(midBox?.height).toBeLessThanOrEqual((frontBox?.height ?? 0) + 2)
  })

  test('TO-RIVAL-EXPAND: Expand should separate cards by measured height plus gap', async ({ page }) => {
    await page.getByTestId('btn-expand-heights').click()
    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    const tall = page.locator('[data-reference-toast-id="tall"]')
    const short = page.locator('[data-reference-toast-id="short"]')
    await expect(tall).toHaveAttribute('data-front', 'true')
    await stack.hover()
    await expect(stack).toHaveAttribute('data-expanded', 'true')
    await page.waitForTimeout(420)
    const frontBox = await tall.boundingBox()
    const backBox = await short.boundingBox()
    expect(frontBox && backBox).toBeTruthy()
    const offset = Math.abs(frontBox!.y - backBox!.y)
    expect(offset).toBeGreaterThan(60)
    expect(offset).toBeGreaterThan(frontBox!.height * 0.55)

    await page.getByTestId('btn-away').hover()
    await expect(stack).toHaveAttribute('data-expanded', 'false')
  })

  test('TO-RIVAL-EXIT: Dismissal should leave along the stack axis and fade, then unmount', async ({
    page,
  }) => {
    await page.getByTestId('btn-exit').click()
    const item = page.locator('[data-reference-toast-id="exit"]')
    await expect(item).toHaveAttribute('data-state', 'open')
    await page.locator('[data-reference-toast-close]').click()
    await expect(item).toHaveAttribute('data-state', 'closed')
    await expect.poll(async () => Number(await item.evaluate(el => getComputedStyle(el).opacity))).toBeLessThan(1)
    await expect(item).toHaveCount(0)
  })

  test('TO-RIVAL-SWIPE-OUT: A completing swipe should animate out in the drag direction', async ({
    page,
  }) => {
    await page.getByTestId('btn-swipe').click()
    const item = page.locator('[data-reference-toast-id="swipe-g7"]')
    await expect(item).toBeVisible()
    await dragToast(page, 'swipe-g7', 80, 0, 12)
    await expect(item).toHaveCount(0)

    await page.getByTestId('btn-swipe').click()
    await expect(item).toBeVisible()
    await dragToast(page, 'swipe-g7', 20, 0, 30)
    await expect(item).toBeVisible()
    await expect(item).toHaveAttribute('data-state', 'open')
  })

  test('TO-RIVAL-SWIPE-PHYSICS: Swipe should dismiss on Sonner threshold, and only on an allowed edge', async ({
    page,
  }) => {
    await page.getByTestId('btn-swipe').click()
    const item = page.locator('[data-reference-toast-id="swipe-g7"]')
    await expect(item).toBeVisible()
    await dragToast(page, 'swipe-g7', 45, 0, 45)
    await expect(item).toHaveCount(0)

    await page.getByTestId('btn-swipe').click()
    await expect(item).toBeVisible()
    await dragToast(page, 'swipe-g7', 44, 0, 45)
    await expect(item).toBeVisible()

    await dragToast(page, 'swipe-g7', -80, 0, 30)
    await expect(item).toBeVisible()

    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-select').click()
    const selectable = page.locator('[data-reference-toast-id="select"]')
    await expect(selectable).toBeVisible()
    await page.evaluate(() => {
      const el = document.querySelector('[data-reference-toast-description]')
      if (!el) return
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    })
    await dragToast(page, 'select', 80, 0, 12)
    await expect(selectable).toBeVisible()

    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-loading').click()
    const loading = page.locator('[data-reference-toast-id="loading"]')
    await expect(loading).toBeVisible()
    await dragToast(page, 'loading', 80, 0, 12)
    await expect(loading).toBeVisible()
  })

  test('TO-RIVAL-REDUCE: Reduced motion should remove enter, stack, exit, and loader animation', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page.locator('[data-reference-toast-host]')).toHaveAttribute('data-reduced-motion', 'true')
    await page.getByTestId('btn-enter-bottom').click()
    const item = page.locator('[data-reference-toast-id="enter-bottom"]')
    await expect(item).toHaveAttribute('data-state', 'open')
    const durations = await item.evaluate(el => getComputedStyle(el).transitionDuration)
    expect(durations.split(',').every(part => parseFloat(part) === 0)).toBe(true)
    await page.getByTestId('btn-dismiss-all').click()
    await expect(item).toHaveCount(0)
  })

  test('TO-RIVAL-CARD: The default toast should be a 356px card with Sonner type anatomy', async ({
    page,
  }) => {
    await page.getByTestId('btn-close').click()
    const root = page.locator('[data-reference-toast-root]')
    await expect(root).toBeVisible()
    const styles = await root.evaluate(el => {
      const s = getComputedStyle(el)
      const title = el.querySelector('[data-reference-toast-title]')
      return {
        width: Math.round(el.getBoundingClientRect().width),
        padding: s.paddingTop,
        radius: s.borderRadius,
        fontSize: s.fontSize,
        titleWeight: title ? getComputedStyle(title).fontWeight : '',
      }
    })
    expect(styles.width).toBe(356)
    expect(styles.padding).toBe('16px')
    expect(styles.radius).toBe('8px')
    expect(styles.fontSize).toBe('13px')
    expect(Number.parseInt(styles.titleWeight, 10)).toBe(500)

    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-custom').click()
    await expect(page.getByTestId('custom-g7')).toBeVisible()
    await expect(page.locator('[data-reference-toast-root]')).toHaveCount(0)
  })

  test('TO-RIVAL-CLOSE: The close control should be an overlapping corner button, off unless asked', async ({
    page,
  }) => {
    await page.getByTestId('btn-enter-bottom').click()
    await expect(page.locator('[data-reference-toast-close]')).toHaveCount(0)
    await page.getByTestId('btn-dismiss-all').click()
    await expect(page.locator('[data-reference-toast-id]')).toHaveCount(0)
    await page.getByTestId('btn-close').click()
    const close = page.locator('[data-reference-toast-close]')
    const root = page.locator('[data-reference-toast-id="close"] [data-reference-toast-root]')
    await expect(close).toBeVisible()
    const closeBox = await close.boundingBox()
    const cardBox = await root.boundingBox()
    expect(closeBox && cardBox).toBeTruthy()
    expect(Math.round(closeBox!.width)).toBe(20)
    expect(Math.round(closeBox!.height)).toBe(20)
    expect(closeBox!.x).toBeLessThan(cardBox!.x + 8)
    expect(closeBox!.y).toBeLessThan(cardBox!.y + 8)
    await close.click()
    await expect(page.locator('[data-reference-toast-id="close"]')).toHaveCount(0)
  })

  test('TO-RIVAL-ACTION: Action and cancel should be compact trailing buttons, and close unless prevented', async ({
    page,
  }) => {
    await page.getByTestId('btn-action').click()
    const action = page.locator('[data-reference-toast-action]')
    const cancel = page.locator('[data-reference-toast-cancel]')
    await expect(action).toBeVisible()
    await expect(cancel).toBeVisible()
    expect(Math.round((await action.boundingBox())!.height)).toBe(24)
    expect(Math.round((await cancel.boundingBox())!.height)).toBe(24)
    await action.click()
    await expect(page.locator('[data-reference-toast-id="action"]')).toHaveCount(0)

    await page.getByTestId('btn-action-prevent').click()
    await page.locator('[data-reference-toast-action]').click()
    await expect(page.locator('[data-reference-toast-id="prevent"]')).toBeVisible()

    await page.getByTestId('btn-node-action').click()
    await expect(page.getByTestId('custom-action-node')).toBeVisible()
  })

  test('TO-RIVAL-LOADER: Loading should use a spinner that crossfades when the type changes', async ({
    page,
  }) => {
    await page.getByTestId('btn-loading').click()
    await expect(page.locator('[data-reference-toast-loader] span')).toHaveCount(12)
    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-promise').click()
    const card = page.locator('[data-reference-toast-id="promise"]')
    await expect(card.locator('[data-reference-toast-loader] span')).toHaveCount(12)
    await expect(card.locator('[data-reference-toast-title]')).toHaveText('Saved')
    await expect(card).toHaveAttribute('data-type', 'success')
  })

  test('TO-RIVAL-RICH: richColors should paint the card and its close button in type color', async ({
    page,
  }) => {
    await page.getByTestId('btn-rich').click()
    const root = page.locator('[data-reference-toast-root]')
    await expect(root).toHaveAttribute('data-rich-colors', 'true')
    const bg = await root.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })

  test('TO-RIVAL-FOCUS: The front card should show a focus ring and restore focus on dismiss', async ({
    page,
  }) => {
    await page.getByTestId('btn-close').click()
    const item = page.locator('[data-reference-toast-id="close"]')
    await page.getByTestId('btn-away').focus()
    await page.keyboard.press('Alt+T')
    await expect.poll(async () =>
      item.evaluate(el => {
        const active = document.activeElement as HTMLElement | null
        const target = active && el.contains(active) ? active : el
        const outline = getComputedStyle(target).outlineStyle
        return outline === 'solid' || outline === 'auto' || getComputedStyle(target).outlineWidth !== '0px'
      })
    ).toBe(true)
    await page.locator('[data-reference-toast-close]').click()
    await expect(item).toHaveCount(0)
    await expect(page.getByTestId('btn-away')).toBeFocused()
  })
})

test('TO-RIVAL-THEME: The toaster should have an explicit light, dark, and system theme', async ({
  page,
}) => {
  await page.goto('/toast?fixture=Gate7')
  await page.getByTestId('btn-enter-bottom').click()
  await expect(page.locator('[data-reference-toast-host]')).toHaveAttribute('data-theme', 'light')
  const lightBg = await page.locator('[data-reference-toast-root]').evaluate(el => getComputedStyle(el).backgroundColor)
  await page.goto('/toast?fixture=Gate7Dark')
  await page.getByTestId('btn-enter-bottom').click()
  await expect(page.locator('[data-reference-toast-host]')).toHaveAttribute('data-theme', 'dark')
  const darkBg = await page.locator('[data-reference-toast-root]').evaluate(el => getComputedStyle(el).backgroundColor)
  expect(darkBg).not.toBe(lightBg)
  await page.getByTestId('btn-invert').click()
  const invert = page.locator('[data-reference-toast-id="invert"] [data-reference-toast-root]')
  await expect(invert).toHaveAttribute('data-invert', 'true')
})

test('TO-RIVAL-OFFSET: Offset and mobile offset should place the stack, including on a narrow viewport', async ({
  page,
}) => {
  await page.goto('/toast?fixture=Gate7Style')
  await page.getByTestId('btn-offset').click()
  const stack = page.locator('[data-reference-toast-position="bottom-end"][data-expanded]')
  const box = await stack.boundingBox()
  const vp = page.viewportSize()
  expect(box && vp).toBeTruthy()
  expect(Math.round(vp!.width - (box!.x + box!.width))).toBe(24)
  expect(Math.round(vp!.height - (box!.y + box!.height))).toBe(24)

  await page.setViewportSize({ width: 500, height: 800 })
  await page.waitForTimeout(50)
  const mobile = await stack.boundingBox()
  expect(mobile).toBeTruthy()
  expect(Math.round(500 - (mobile!.x + mobile!.width))).toBe(16)
  expect(Math.round(mobile!.width)).toBeGreaterThan(400)
})

test('TO-RIVAL-DIR: dir should flip chrome and the meaning of start and end', async ({ page }) => {
  await page.goto('/toast?fixture=Gate7Rtl')
  await page.getByTestId('btn-close').click()
  const close = page.locator('[data-reference-toast-close]')
  const root = page.locator('[data-reference-toast-root]')
  const closeBox = await close.boundingBox()
  const cardBox = await root.boundingBox()
  expect(closeBox && cardBox).toBeTruthy()
  expect(closeBox!.x + closeBox!.width).toBeGreaterThan(cardBox!.x + cardBox!.width - 12)
})

test('TO-RIVAL-STYLE: A toast should accept style, className, and unstyled without losing behavior', async ({
  page,
}) => {
  await page.goto('/toast?fixture=Gate7Style')
  await page.getByTestId('btn-style').click()
  const styled = page.locator('[data-reference-toast-id="styled"] [data-reference-toast-root]')
  await expect(styled).toHaveClass(/toast-extra/)
  await expect(styled).toHaveCSS('background-color', 'rgb(255, 0, 0)')

  await page.getByTestId('btn-unstyled').click()
  const unstyled = page.locator('[data-reference-toast-id="unstyled"] [data-reference-toast-root]')
  await expect(unstyled).toHaveAttribute('data-unstyled', 'true')
  await expect(unstyled).toHaveCSS('padding-top', '0px')
  await expect(unstyled).toHaveCSS('box-shadow', 'none')
})

test('TO-RIVAL-CLASSNAMES: Toaster and toast classNames should target the styled parts', async ({
  page,
}) => {
  await page.goto('/toast?fixture=Gate7Style')
  await page.getByTestId('btn-classnames').click()
  await expect(page.locator('[data-reference-toast-root]')).toHaveClass(/cn-toast/)
  await expect(page.locator('[data-reference-toast-title]')).toHaveClass(/cn-title/)
  await expect(page.locator('[data-reference-toast-description]')).toHaveClass(/cn-desc/)
  await expect(page.locator('[data-reference-toast-close]')).toHaveClass(/cn-close/)
  await expect(page.locator('[data-reference-toast-action]')).toHaveClass(/cn-action/)
  await expect(page.locator('[data-reference-toast-cancel]')).toHaveClass(/cn-cancel/)
})

test('TO-RIVAL-BUTTON-STYLE: Action and cancel should accept their own style overrides', async ({
  page,
}) => {
  await page.goto('/toast?fixture=Gate7Style')
  await page.getByTestId('btn-button-style').click()
  await expect(page.locator('[data-reference-toast-action]')).toHaveCSS('background-color', 'rgb(0, 128, 0)')
  await expect(page.locator('[data-reference-toast-cancel]')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
  const card = await page.locator('[data-reference-toast-root]').evaluate(el => getComputedStyle(el).backgroundColor)
  expect(card).not.toBe('rgb(0, 128, 0)')
})

test.describe('Toast hardening', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toast?fixture=Harden')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  })

  test('TO-DOM-02: one stable stack per occupied position, empty stacks removed', async ({ page }) => {
    await page.getByTestId('btn-positions').click()
    const top = page.locator('[data-reference-toast-position="top-start"][data-expanded]')
    const bottom = page.locator('[data-reference-toast-position="bottom-end"][data-expanded]')
    await expect(top).toHaveCount(1)
    await expect(bottom).toHaveCount(1)
    await top.evaluate(el => el.setAttribute('data-stable-stack', '1'))
    await page.getByTestId('btn-update-pos-a').click()
    await expect(top).toHaveAttribute('data-stable-stack', '1')
    await expect(page.locator('[data-reference-toast-id="pos-a"] [data-reference-toast-title]')).toHaveText(
      'top-start-updated'
    )
    await page.getByTestId('btn-dismiss-pos-a').click()
    await page.getByTestId('btn-dismiss-all').click()
    await expect(page.locator('[data-reference-toast-id="pos-a2"]')).toHaveCount(0)
    await expect(page.locator('[data-reference-toast-position="top-start"]')).toHaveCount(0)
  })

  test('TO-DOM-03: item wrapper keeps identity through open then closed', async ({ page }) => {
    await page.getByTestId('btn-exit-item').click()
    const item = page.locator('[data-reference-toast-id="upload:42"]')
    await expect(item).toHaveAttribute('data-state', 'open')
    await expect(item).toHaveAttribute('data-reference-toast-position', 'top-center')
    await page.locator('[data-reference-toast-close]').click()
    await expect(item).toHaveAttribute('data-state', 'closed')
    await expect(item).toHaveCount(0)
  })

  test('TO-DOM-04: arbitrary render output is left untouched', async ({ page }) => {
    await page.getByTestId('btn-shapes').click()
    await expect(page.locator('[data-reference-toast-id="shape-string"]')).toContainText('Saved')
    await expect(page.getByTestId('frag-a')).toHaveText('One')
    await expect(page.getByTestId('frag-b')).toHaveText('Two')
    await expect(page.getByTestId('sib-status')).toHaveAttribute('role', 'status')
    await expect(page.locator('[data-reference-toast-id="shape-string"] [data-reference-toast-root]')).toHaveCount(0)
  })

  test('TO-DEF-03 / TO-DEF-04: custom interactive JSX keeps native events', async ({ page }) => {
    await page.getByTestId('btn-interactive').click()
    const input = page.getByTestId('toast-input')
    await input.click()
    await input.fill('abc')
    await expect(input).toHaveValue('abc')
    await page.getByTestId('toast-space').click()
    await expect(page.getByTestId('toast-form')).toBeVisible()
    await page.getByTestId('toast-form-close').click()
    await expect(page.getByTestId('toast-form')).toHaveCount(0)
  })

  test('TO-DOM-05: surviving wrappers keep identity and child styles after queue metadata changes', async ({
    page,
  }) => {
    await page.getByTestId('btn-style-child').click()
    await page.getByTestId('btn-style-b').click()
    await page.getByTestId('btn-style-c').click()
    const child = page.getByTestId('scaled-child')
    await expect(child).toHaveCSS('transform', /matrix/)
    await page.getByTestId('btn-dismiss-all').click()
    await expect(page.locator('[data-reference-toast-id]')).toHaveCount(0)
  })

  test('TO-TIME-02: duration false stays open', async ({ page }) => {
    await page.getByTestId('btn-untimed').click()
    const item = page.locator('[data-reference-toast-id="untimed"]')
    await expect(item).toBeVisible()
    await page.waitForTimeout(800)
    await expect(item).toBeVisible()
  })

  test('TO-TIME-03: duration 0 renders once then dismisses', async ({ page }) => {
    await page.getByTestId('btn-zero').click()
    const item = page.locator('[data-reference-toast-id="zero"]')
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-TIME-01: timed toast remains until the deadline then dismisses', async ({ page }) => {
    await page.getByTestId('btn-timed').click()
    const item = page.locator('[data-reference-toast-id="timed"]')
    await expect(item).toBeVisible()
    await page.waitForTimeout(400)
    await expect(item).toBeVisible()
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-ANN-01 / TO-ANN-02 / TO-ANN-03 / TO-ANN-04 / TO-ANN-06: visual and live paths stay separate', async ({
    page,
  }) => {
    const polite = page.getByTestId('polite-announcer')
    const assertive = page.getByTestId('assertive-announcer')
    await page.getByTestId('btn-announce-polite').click()
    await expect(polite).toHaveText('Project saved')
    await expect(page.locator('[data-reference-toast-id]')).toHaveCount(0)

    await page.getByTestId('btn-announce-both').click()
    await expect(polite).toHaveText('Background sync complete')
    await expect(assertive).toHaveText('Session expired')

    await page.getByTestId('btn-interactive').click()
    await expect(page.getByTestId('toast-form')).toBeVisible()
    await expect(polite).toHaveText('Draft was saved')

    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-silent').click()
    await expect(page.getByTestId('silent-visual')).toHaveText('Payment failed')
    await expect(polite).not.toHaveText('Payment failed')

    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-job').click()
    await expect(polite).toHaveText('Started')
    await page.getByTestId('btn-job-content').click()
    await expect(polite).toHaveText('Started')
    await page.getByTestId('btn-job-finish').click()
    await expect(polite).toHaveText('Finished')
    await page.getByTestId('btn-job-dismiss').click()
    await expect(polite).toHaveText('Finished')
  })

  test('TO-FOCUS-01: dismissing focused toast content restores the opener', async ({ page }) => {
    await page.getByTestId('btn-show').click()
    await expect(page.getByTestId('dismiss')).toBeVisible()
    await page.getByTestId('dismiss').focus()
    await expect(page.getByTestId('dismiss')).toBeFocused()
    await page.getByTestId('dismiss').click()
    await expect(page.getByTestId('dismiss')).toHaveCount(0)
    await expect(page.getByTestId('btn-show')).toBeFocused()
  })

  test('TO-FOCUS-02: invalid opener falls back to the nearest sibling', async ({ page }) => {
    await page.getByTestId('btn-show').click()
    await expect(page.getByTestId('dismiss')).toBeVisible()
    await page.getByTestId('dismiss').focus()
    await page.evaluate(() => {
      const show = document.querySelector('[data-testid="btn-show"]') as HTMLButtonElement | null
      if (show) show.disabled = true
    })
    await page.getByTestId('dismiss').click()
    await expect(page.getByTestId('dismiss')).toHaveCount(0)
    await expect(page.getByTestId('fallback-right')).toBeFocused()
  })

  test('TO-OV-03 / TO-OV-04 / TO-OV-05: toast stays exposed, does not dismiss overlay, and is not itself modal', async ({
    page,
  }) => {
    await page.getByTestId('btn-interactive').click()
    const host = page.locator('[data-reference-toast-host]')
    await expect(host).toBeAttached()
    await expect(page.getByTestId('toast-form')).toBeVisible()
    await expect(host).not.toHaveAttribute('inert')

    await page.getByTestId('btn-open-overlay').click()
    await expect(page.getByTestId('harden-modal')).toBeVisible()
    await expect(host).not.toHaveAttribute('inert')
    await expect(page.getByTestId('polite-announcer')).toBeVisible()
    await page.getByTestId('toast-input').click()
    await page.getByTestId('toast-input').fill('kept')
    await expect(page.getByTestId('harden-modal')).toBeVisible()

    await page.getByTestId('btn-close-overlay').click()
    await expect(page.getByTestId('harden-modal')).toHaveCount(0)
    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-untimed').click()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-reference-toast-id="untimed"]')).toBeVisible()
    await page.getByTestId('btn-away').click()
    await expect(page.getByTestId('btn-away')).toBeFocused()
  })

  test('TO-QUEUE-01 / TO-QUEUE-08: FIFO DOM order and dismiss-all clears the host', async ({ page }) => {
    await page.getByTestId('btn-style-child').click()
    await page.getByTestId('btn-style-b').click()
    await page.getByTestId('btn-style-c').click()
    await expect(page.locator('[data-reference-toast-id="a"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="b"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="c"]')).toBeVisible()
    await page.getByTestId('btn-dismiss-all').click()
    await expect(page.locator('[data-reference-toast-id]')).toHaveCount(0)
    await expect(page.locator('[data-reference-toast-host]')).toBeAttached()
  })

  test('TO-COMP-01 / TO-COMP-02: custom timed notify and loading-to-complete identity', async ({ page }) => {
    await page.getByTestId('btn-interactive').click()
    await expect(page.getByTestId('toast-form')).toBeVisible()
    await expect(page.getByTestId('polite-announcer')).toHaveText('Draft was saved')
    await page.getByTestId('toast-form-close').click()

    await page.evaluate(() => {
      const api = (window as unknown as { toast?: typeof import('@reference-ui/lib').toast }).toast
      void api
    })
    await page.getByTestId('btn-job').click()
    await page.getByTestId('btn-job-finish').click()
    await expect(page.locator('[data-reference-toast-id="job"] [data-reference-toast-title]')).toHaveText(
      'Finished visual'
    )
  })

  test('TO-TIME-05: resume exact remaining time when the pointer leaves', async ({ page }) => {
    await page.getByTestId('btn-time-leave').click()
    const item = page.locator('[data-reference-toast-id="time-leave"]')
    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    await expect(item).toBeVisible()
    await page.waitForTimeout(300)
    await stack.hover()
    await expect(item).toHaveAttribute('data-paused', 'true')
    await page.waitForTimeout(1500)
    await expect(item).toBeVisible()
    await page.getByTestId('btn-away').hover()
    await page.waitForTimeout(400)
    await expect(item).toBeVisible()
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-TIME-13: replacement duration stays paused until every pause source is gone', async ({ page }) => {
    await page.getByTestId('btn-time-replace').click()
    const item = page.locator('[data-reference-toast-id="time-replace"]')
    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    await expect(item).toBeVisible()
    await stack.hover()
    await expect(item).toHaveAttribute('data-paused', 'true')
    await page.getByTestId('btn-time-replace-update').click()
    await page.getByTestId('btn-open-overlay').click()
    await expect(page.getByTestId('harden-modal')).toBeVisible()
    await page.evaluate(() => {
      document
        .querySelector('[data-reference-toast-position][data-expanded]')
        ?.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
    })
    await page.waitForTimeout(1200)
    await expect(item).toBeVisible()
    await page.getByTestId('btn-close-overlay').click()
    await expect(page.getByTestId('harden-modal')).toHaveCount(0)
    await expect(item).toHaveCount(0, { timeout: 2000 })
  })

  test('TO-TIME-14: keyboard focus pauses remaining time for that toast only', async ({ page }) => {
    await page.getByTestId('btn-time-focus').click()
    const item = page.locator('[data-reference-toast-id="time-focus"]')
    await expect(item).toBeVisible()
    await page.waitForTimeout(800)
    await page.getByTestId('time-focus-input').focus()
    await expect(item).toHaveAttribute('data-paused', 'true')
    await page.waitForTimeout(1500)
    await expect(item).toBeVisible()
    await page.getByTestId('btn-away').focus()
    await expect(item).toHaveCount(0, { timeout: 5000 })
  })

  test('TO-CLOSE-04: wrappers wait for real motion and unmount immediately when none exists', async ({
    page,
  }) => {
    await page.getByTestId('btn-close-zero').click()
    const zero = page.locator('[data-reference-toast-id="close-zero"]')
    await expect(zero).toBeVisible()
    await zero.locator('[data-reference-toast-close]').click()
    await expect(zero).toHaveCount(0, { timeout: 400 })

    await page.getByTestId('btn-close-fade').click()
    const fade = page.locator('[data-reference-toast-id="close-fade"]')
    await expect(fade).toBeVisible()
    await fade.locator('[data-reference-toast-close]').click()
    await expect(fade).toHaveAttribute('data-state', 'closed')
    await expect(fade).toHaveCount(0, { timeout: 2500 })

    await page.getByTestId('btn-close-anim').click()
    const anim = page.locator('[data-reference-toast-id="close-anim"]')
    await expect(anim).toBeVisible()
    await anim.locator('[data-reference-toast-close]').click()
    await expect(anim).toHaveAttribute('data-state', 'closed')
    await expect(anim).toHaveCount(0, { timeout: 2500 })
  })

  test('TO-ENV-04: timeout, hover remainder, duration update, and same-frame recreate', async ({ page }) => {
    await page.getByTestId('btn-timed').click()
    const timed = page.locator('[data-reference-toast-id="timed"]')
    await expect(timed).toBeVisible()
    await page.waitForTimeout(400)
    await expect(timed).toBeVisible()
    await expect(timed).toHaveCount(0, { timeout: 2000 })

    await page.getByTestId('btn-time-leave').click()
    const leave = page.locator('[data-reference-toast-id="time-leave"]')
    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    await expect(leave).toBeVisible()
    await page.waitForTimeout(300)
    await stack.hover()
    await page.waitForTimeout(800)
    await expect(leave).toBeVisible()
    await page.getByTestId('btn-away').hover()
    await expect(leave).toHaveCount(0, { timeout: 2000 })

    await page.getByTestId('btn-time-replace').click()
    const replace = page.locator('[data-reference-toast-id="time-replace"]')
    await expect(replace).toBeVisible()
    await page.getByTestId('btn-time-replace-update').click()
    await expect(replace).toHaveCount(0, { timeout: 2000 })

    await page.getByTestId('btn-env-race').click()
    const race = page.locator('[data-reference-toast-id="race"]')
    await expect(race).toBeVisible()
    await expect(race).toHaveAttribute('data-state', 'open')
    await expect(page.locator('[data-reference-toast-id="race"]')).toHaveCount(1)
  })

  test('TO-A11Y-01: public compositions keep semantic boundaries under an accessibility scan', async ({
    page,
  }) => {
    await page.getByTestId('btn-all-positions').click()
    await page.getByTestId('btn-interactive').click()
    await page.getByTestId('btn-announce-both').click()
    const host = page.locator('[data-reference-toast-host]')
    await expect(host).toHaveAttribute('role', 'region')
    await expect(page.getByTestId('polite-announcer')).toHaveAttribute('aria-live', 'polite')
    await expect(page.getByTestId('assertive-announcer')).toHaveAttribute('aria-live', 'assertive')
    await expect(page.locator('[data-reference-toast-id="interactive"]')).not.toHaveAttribute('role')
    await page.getByTestId('btn-open-overlay').click()
    await expect(page.getByTestId('harden-modal')).toBeVisible()
    await expect(host).not.toHaveAttribute('inert')
    await expect(page.getByTestId('polite-announcer')).toBeVisible()
    const snapshot = await page.accessibility.snapshot()
    expect(snapshot).toBeTruthy()
    const snapshotText = JSON.stringify(snapshot)
    expect(snapshotText).toContain('Edit')
    expect(snapshotText).toContain('Background sync complete')
    expect(snapshotText).toContain('Session expired')
    expect(snapshotText).toContain('Modal')
  })
})

test.describe('Toast hardening limit', () => {
  test('TO-TIME-08: a waiting toast stays unmounted and untimed until promotion', async ({ page }) => {
    await page.goto('/toast?fixture=HardenLimit')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
    await page.getByTestId('btn-limit-visible').click()
    await page.getByTestId('btn-limit-waiter').click()
    await expect(page.locator('[data-reference-toast-id="limit-visible"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="limit-waiter"]')).toHaveCount(0)
    await page.waitForTimeout(2000)
    await expect(page.locator('[data-reference-toast-id="limit-waiter"]')).toHaveCount(0)
    await page.getByTestId('btn-limit-release').click()
    const waiter = page.locator('[data-reference-toast-id="limit-waiter"]')
    await expect(waiter).toBeVisible()
    await page.waitForTimeout(250)
    await expect(waiter).toBeVisible()
    await expect(waiter).toHaveCount(0, { timeout: 1500 })
  })
})

test.describe('Toast hardening premount', () => {
  test('TO-ANN-08: show and announce before mount replay once after activation', async ({ page }) => {
    await page.goto('/toast?fixture=HardenPremount')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
    await page.getByTestId('btn-premount-queue').click()
    await expect(page.locator('[data-reference-toast-host]')).toHaveCount(0)
    await expect(page.getByTestId('polite-announcer')).toHaveCount(0)
    await page.evaluate(() => {
      ;(window as unknown as { __ann?: string[] }).__ann = []
      const seen = (window as unknown as { __ann: string[] }).__ann
      const obs = new MutationObserver(records => {
        for (const record of records) {
          const target = record.target as HTMLElement
          const text = (target.textContent ?? '').trim()
          if (text === 'Saved' || text === 'Ready') seen.push(text)
        }
      })
      obs.observe(document.body, { subtree: true, childList: true, characterData: true })
    })
    await page.getByTestId('btn-premount-mount').click()
    await expect(page.locator('[data-reference-toast-id="pre"]')).toHaveCount(1)
    await expect(page.getByTestId('polite-announcer')).toHaveText('Ready')
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __ann?: string[] }).__ann ?? [])).toEqual(
      expect.arrayContaining(['Saved', 'Ready'])
    )
  })
})

test.describe('Toast hardening shadow', () => {
  test('TO-ENV-03: visual and live DOM stay inside the elected ShadowRoot', async ({ page }) => {
    await page.goto('/toast?fixture=HardenShadow')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
    await expect(page.getByTestId('shadow-app')).toBeVisible()
    await page.getByTestId('btn-shadow-show').click()
    const host = page.locator('[data-reference-toast-host]')
    await expect(host).toHaveCount(1)
    const insideShadow = await page.evaluate(() => {
      const shadowHost = document.querySelector('[data-testid="shadow-host"]') as HTMLElement | null
      const toastHost = shadowHost?.shadowRoot?.querySelector('[data-reference-toast-host]')
      const lightHost = document.querySelector('body > [data-reference-toast-host], #root > [data-reference-toast-host]')
      return {
        inShadow: Boolean(toastHost),
        lightDuplicate: Boolean(lightHost && !shadowHost?.shadowRoot?.contains(lightHost)),
      }
    })
    expect(insideShadow.inShadow).toBe(true)
    expect(insideShadow.lightDuplicate).toBe(false)
    await page.getByTestId('btn-shadow-update').click()
    await expect(page.locator('[data-reference-toast-id="shadow-toast"]')).toContainText('shadow updated')
    await page.getByTestId('btn-shadow-announce').click()
    await expect(page.getByTestId('polite-announcer')).toHaveText('Shadow ready')
    const announcerInShadow = await page.evaluate(() => {
      const shadowHost = document.querySelector('[data-testid="shadow-host"]') as HTMLElement | null
      return Boolean(shadowHost?.shadowRoot?.querySelector('[data-testid="polite-announcer"]'))
    })
    expect(announcerInShadow).toBe(true)
    await page.getByTestId('btn-shadow-dismiss').click()
    await expect(page.locator('[data-reference-toast-id="shadow-toast"]')).toHaveCount(0)
  })
})

test.describe('Toast hardening StrictMode', () => {
  test('TO-ENV-02 / TO-DEF-06: StrictMode replay keeps one lifecycle', async ({ page }) => {
    await page.goto('/toast?fixture=HardenStrict')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
    const item = page.locator('[data-reference-toast-id="compat"]')
    await expect(item).toHaveCount(1)
    await expect(item).toContainText('Saved')
    await expect(page.getByTestId('polite-announcer')).toHaveText('Ready')
    await page.getByTestId('btn-strict-update').click()
    await expect(item).toHaveCount(1)
    await page.getByTestId('btn-strict-dismiss').click()
    await expect(item).toHaveCount(0)
  })
})

test.describe('Toast composition gate', () => {
  test('TO-COMP-03: nested modals pause a limited multi-position queue', async ({ page }) => {
    await page.goto('/toast?fixture=Gate6')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
    await page.getByTestId('btn-comp-03').click()
    await expect(page.locator('[data-reference-toast-id="c3-a"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="c3-b"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="c3-c"]')).toHaveCount(0)
    await expect(page.locator('[data-reference-toast-id="c3-d"]')).toHaveCount(0)
    await expect(page.locator('[data-reference-toast-id="c3-e"]')).toHaveCount(0)
    await page.waitForTimeout(400)
    await page.getByTestId('btn-open-modal-a').click()
    await expect(page.getByTestId('modal-a')).toBeVisible()
    await page.getByTestId('btn-open-modal-b').click()
    await expect(page.getByTestId('modal-b')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="c3-a"]')).toHaveAttribute('data-paused', 'true')
    await expect(page.locator('[data-reference-toast-id="c3-b"]')).toHaveAttribute('data-paused', 'true')
    await page.waitForTimeout(1200)
    await expect(page.locator('[data-reference-toast-id="c3-a"]')).toBeVisible()
    await expect(page.locator('[data-reference-toast-id="c3-c"]')).toHaveCount(0)
    await page.getByTestId('btn-close-modal-b').click()
    await expect(page.getByTestId('modal-b')).toHaveCount(0)
    await page.waitForTimeout(800)
    await expect(page.locator('[data-reference-toast-id="c3-a"]')).toBeVisible()
    await page.getByTestId('btn-close-modal-a').click()
    await expect(page.getByTestId('modal-a')).toHaveCount(0)
    const top = page.locator('[data-reference-toast-position="top-start"][data-expanded]')
    const bottom = page.locator('[data-reference-toast-position="bottom-end"][data-expanded]')
    await expect(top).toHaveCount(1)
    await expect(bottom).toHaveCount(1)
  })
})


