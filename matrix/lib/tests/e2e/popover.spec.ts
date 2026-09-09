import { expect, test, type Locator } from '@playwright/test'

test.describe('Popover Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/popover')
    await expect(page.getByTestId('popover-fixture-root')).toBeVisible()
  })

  test('PO-DOM-01 & PO-DOM-02: Toggles Popover open/closed and updates ARIA attributes', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await trigger.click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()
    await expect(content.getByTestId('popover-title')).toHaveText('Popover Header')

    await page.getByTestId('btn-popover-close').click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)
  })

  test('Escape key dismisses popover and returns focus to trigger', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await trigger.click()
    await expect(content).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('PO-POS: Content is anchored below the Trigger, not hardcoded', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await trigger.click()
    await expect(content).toBeVisible()
    await expectAnchoredBottomStart(trigger, content)

    const inline = await content.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))
    expect(inline.position === 'absolute' || inline.position === 'fixed').toBe(true)
    expect(inline.top).toMatch(/px$/)
    expect(inline.left).toMatch(/px$/)
  })

  test('Outside press light-dismisses the popover', async ({ page }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await trigger.click()
    await expect(content).toBeVisible()

    await page.getByTestId('btn-outside').click()
    await expect(content).toHaveCount(0)
  })

  test('PO-FLIP-01: Popover should flip to the opposite side when its preferred side overflows', async ({ page }) => {
    await page.goto('/popover?fixture=Placements')
    const trigger = page.locator('button', { hasText: 'bottom' }).first()
    await trigger.evaluate((node) => {
      node.style.position = 'fixed'
      node.style.bottom = '10px'
    })
    await trigger.click()
    const content = page.locator('[data-reference-overlay-content]')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-side', 'top')
  })

  test('PO-SHIFT-01: Popover should shift within collision padding when Content partially overflows', async ({ page }) => {
    await page.goto('/popover?fixture=Placements')
    const trigger = page.locator('button', { hasText: 'top' }).first()
    await trigger.evaluate((node) => {
      node.style.position = 'fixed'
      node.style.right = '0px'
      node.style.top = '50px'
    })
    await trigger.click()
    const content = page.locator('[data-reference-overlay-content]')
    await expect(content).toBeVisible()
    const box = await content.boundingBox()
    const viewport = page.viewportSize()
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width)
  })

  test('PO-ARROW-01: Popover should center Arrow on its anchor', async ({ page }) => {
    await page.goto('/popover?fixture=ClickToOpen')
    const trigger = page.locator('button', { hasText: 'Open popover' })
    await trigger.click()
    const arrow = page.locator('[data-reference-popover-arrow]')
    await expect(arrow).toBeVisible()
    const triggerBox = await trigger.boundingBox()
    const arrowBox = await arrow.boundingBox()
    const triggerCenter = triggerBox!.x + triggerBox!.width / 2
    const arrowCenter = arrowBox!.x + arrowBox!.width / 2
    expect(Math.abs(triggerCenter - arrowCenter)).toBeLessThan(5)
  })

  test('PO-HOVER-01: Popover should issue delayed open request when mouse remains over openOnHover Trigger', async ({ page }) => {
    await page.goto('/popover?fixture=HoverCard')
    const trigger = page.locator('button', { hasText: 'Hover for preview' })
    const content = page.locator('[data-reference-overlay-content]')
    await trigger.hover()
    await expect(content).toHaveCount(0)
    await page.mouse.move(0, 0)
    await page.waitForTimeout(350)
    await expect(content).toHaveCount(0)

    await trigger.hover()
    await page.waitForTimeout(350)
    await expect(content).toBeVisible()
  })

  test('PO-HOVER-02: Popover should stay open when the pointer travels diagonally from Trigger toward interactive Content', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')

    await trigger.hover()
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')

    await moveDiagonallyThroughGap(page, trigger, content)
    await page.waitForTimeout(250)
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')
  })

  test('PO-HOVER-03: Popover should request delayed close when the pointer leaves the safe region and should cancel it on reentry', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')
    const away = page.getByTestId('hover-away')

    await trigger.hover()
    await expect(content).toBeVisible()

    await away.hover()
    await page.waitForTimeout(80)
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')
    await page.waitForTimeout(180)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('open,dismiss')

    await trigger.hover()
    await expect(content).toBeVisible()
    await away.hover()
    await page.waitForTimeout(80)
    await trigger.hover()
    await page.waitForTimeout(250)
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open,dismiss,open')
  })

  test('PO-HOVER-04: Popover should preserve one open interaction when the pointer moves from Content back to Trigger through their padded gap', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')

    await trigger.hover()
    await expect(content).toBeVisible()
    await content.hover()
    await moveThroughTroughToTrigger(page, trigger, content)
    await page.waitForTimeout(250)
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')
  })

  test('PO-HOVER-05: Popover should leave hover grace when pointer travel is slow, reversed, or crosses the side opposite Content', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')

    await trigger.hover()
    await expect(content).toBeVisible()
    await moveSlowlyAway(page, trigger, content)
    await page.waitForTimeout(250)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('open,dismiss')

    await trigger.hover()
    await expect(content).toBeVisible()
    await reverseAway(page, trigger)
    await page.waitForTimeout(250)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('open,dismiss,open,dismiss')

    await trigger.hover()
    await expect(content).toBeVisible()
    await leaveOppositeSide(page, trigger)
    await page.waitForTimeout(250)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('open,dismiss,open,dismiss,open,dismiss')
  })

  test('PO-HOVER-07: Popover should remain open when Trigger is clicked within the 300-millisecond impatient window after hover-open', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')

    await trigger.hover()
    await expect(content).toBeVisible()
    await trigger.click({ force: true })
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')
  })

  test('PO-HOVER-08: Popover should use normal Trigger dismissal when a deliberate click occurs after the patient threshold', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')

    await trigger.hover()
    await expect(content).toBeVisible()
    await page.waitForTimeout(350)
    await trigger.click()
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('open,dismiss')
  })

  test('PO-HOVER-09: Popover should avoid mouse-intent timers when touch or non-hover pen input synthesizes pointer entry', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const log = page.getByTestId('hover-log')

    await trigger.evaluate(el => {
      el.dispatchEvent(
        new PointerEvent('pointerenter', {
          bubbles: true,
          pointerType: 'touch',
          pointerId: 1,
          clientX: 10,
          clientY: 10,
        })
      )
    })
    await page.waitForTimeout(250)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('')

    await trigger.evaluate(el => {
      el.dispatchEvent(
        new PointerEvent('pointerenter', {
          bubbles: true,
          pointerType: 'pen',
          pointerId: 2,
          pressure: 0.5,
          clientX: 10,
          clientY: 10,
        })
      )
    })
    await page.waitForTimeout(250)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('')
  })

  test('PO-HOVER-10: Popover should stay open when pointer or focus remains in interactive hover Content', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const trigger = page.getByTestId('hover-trigger')
    const content = page.getByTestId('hover-content')
    const inside = page.getByTestId('hover-content-btn')
    const log = page.getByTestId('hover-log')
    const away = page.getByTestId('hover-away')

    await trigger.hover()
    await expect(content).toBeVisible()
    await inside.click()
    await away.hover()
    await page.waitForTimeout(250)
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')
  })

  test('PO-HOVER-11: Popover should share one open intent when keyboard focus drives an openOnHover instance', async ({ page }) => {
    await page.goto('/popover?fixture=HoverGrace')
    const content = page.getByTestId('hover-content')
    const inside = page.getByTestId('hover-content-btn')
    const log = page.getByTestId('hover-log')
    const away = page.getByTestId('hover-away')

    await page.getByTestId('hover-before').focus()
    await page.keyboard.press('Tab')
    await expect(content).toBeVisible()
    await expect(log).toHaveText('open')
    await inside.focus()
    await page.waitForTimeout(250)
    await expect(content).toBeVisible()
    await away.focus()
    await page.waitForTimeout(250)
    await expect(content).toHaveCount(0)
    await expect(log).toHaveText('open,dismiss')
  })

  test('PO-LAYER-01: Popover should register once when it is a child layer of Overlay', async ({ page }) => {
    await page.goto('/popover?fixture=NestedLayer')
    const dialogTrigger = page.getByTestId('dialog-trigger')
    const popoverTrigger = page.getByTestId('nested-popover-trigger')
    const dialog = page.getByTestId('dialog-content')
    const popover = page.getByTestId('nested-popover-content')
    const count = page.getByTestId('overlay-live-count')

    await dialogTrigger.click()
    await expect(dialog).toBeVisible()
    await expect(count).toHaveText('1')

    await popoverTrigger.click()
    await expect(popover).toBeVisible()
    await expect(count).toHaveText('2')

    await page.keyboard.press('Escape')
    await expect(popover).toHaveCount(0)
    await expect(dialog).toBeVisible()
    await expect(count).toHaveText('1')
  })
})

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}

async function moveDiagonallyThroughGap(
  page: { mouse: { move: (x: number, y: number, options?: { steps?: number }) => Promise<void> } },
  trigger: Locator,
  content: Locator
) {
  const t = await trigger.boundingBox()
  const c = await content.boundingBox()
  expect(t).toBeTruthy()
  expect(c).toBeTruthy()
  const start = { x: t!.x + t!.width - 4, y: t!.y + t!.height - 2 }
  const mid = {
    x: t!.x + t!.width + 24,
    y: t!.y + t!.height + (c!.y - (t!.y + t!.height)) / 2,
  }
  const end = { x: c!.x + c!.width - 20, y: c!.y + 12 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.move(mid.x, mid.y, { steps: 10 })
  await page.mouse.move(end.x, end.y, { steps: 10 })
}

async function moveThroughTroughToTrigger(
  page: { mouse: { move: (x: number, y: number, options?: { steps?: number }) => Promise<void> } },
  trigger: Locator,
  content: Locator
) {
  const t = await trigger.boundingBox()
  const c = await content.boundingBox()
  expect(t).toBeTruthy()
  expect(c).toBeTruthy()
  const x = t!.x + t!.width / 2
  await page.mouse.move(x, c!.y + 8)
  await page.mouse.move(x, t!.y + t!.height + (c!.y - (t!.y + t!.height)) / 2, { steps: 6 })
  await page.mouse.move(x, t!.y + t!.height / 2, { steps: 6 })
}

async function moveSlowlyAway(
  page: {
    mouse: { move: (x: number, y: number) => Promise<void> }
    waitForTimeout: (ms: number) => Promise<void>
  },
  trigger: Locator,
  content: Locator
) {
  const t = await trigger.boundingBox()
  const c = await content.boundingBox()
  expect(t).toBeTruthy()
  expect(c).toBeTruthy()
  let x = t!.x + t!.width - 4
  let y = t!.y + t!.height - 2
  await page.mouse.move(x, y)
  for (let i = 0; i < 8; i++) {
    x += 2
    y += 2
    await page.mouse.move(x, y)
    await page.waitForTimeout(50)
  }
}

async function reverseAway(
  page: { mouse: { move: (x: number, y: number, options?: { steps?: number }) => Promise<void> } },
  trigger: Locator
) {
  const t = await trigger.boundingBox()
  expect(t).toBeTruthy()
  const x = t!.x + t!.width / 2
  await page.mouse.move(x, t!.y + t!.height - 2)
  await page.mouse.move(x, t!.y + t!.height + 16, { steps: 4 })
  await page.mouse.move(x, t!.y - 28, { steps: 8 })
}

async function leaveOppositeSide(
  page: { mouse: { move: (x: number, y: number, options?: { steps?: number }) => Promise<void> } },
  trigger: Locator
) {
  const t = await trigger.boundingBox()
  expect(t).toBeTruthy()
  const x = t!.x + t!.width / 2
  await page.mouse.move(x, t!.y + 4)
  await page.mouse.move(x, t!.y - 36, { steps: 6 })
}
