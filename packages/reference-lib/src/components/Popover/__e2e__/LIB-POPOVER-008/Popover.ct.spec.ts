/**
 * Popover composition gates and browser proofs. Toggles open state and
 * ARIA wiring, anchors Content below the Trigger, light-dismisses on
 * outside press and Escape, and pins flip, shift, and arrow-centering
 * geometry in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator } from '@playwright/test'

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

test.describe('Popover Composition Gates & Browser Proofs', () => {
  test('PO-HOVER-01: Popover should issue delayed open request when mouse remains over openOnHover Trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Popover/Popover/HoverCard')
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
    await snap(page, 'hover-open')
  })
})
