import { test, expect, snap } from '../../../../playwright/ct'
import type { Locator } from '@playwright/test'

async function expectAnchoredTop(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y + contentBox!.height).toBeLessThanOrEqual(triggerBox!.y + 2)
  expect(contentBox!.y + contentBox!.height).toBeGreaterThan(triggerBox!.y - 32)

  const triggerMid = triggerBox!.x + triggerBox!.width / 2
  expect(contentBox!.x).toBeLessThan(triggerMid)
  expect(contentBox!.x + contentBox!.width).toBeGreaterThan(triggerMid)
}

test.describe('Tooltip Composition Gates & Browser Proofs', () => {
  test('TT-DOM-01 & TT-DOM-02: Slotted Trigger gains aria-describedby and shows Content on focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await expect(contentA).toHaveCount(0)
    await page.waitForTimeout(200)
    await snap(page, 'basic-resting')

    await btnA.focus()

    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expect(contentA).toHaveText('Help text for Button A')

    const contentId = await contentA.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(btnA).toHaveAttribute('aria-describedby', contentId!)
    await page.waitForTimeout(200)
    await snap(page, 'focus-open-btn-a')

    await page.getByTestId('btn-outside').focus()
    await expect(contentA).toHaveCount(0)
  })

  test('Hovering over trigger opens tooltip next to the trigger', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnB = page.getByTestId('btn-tooltip-b')
    const contentB = page.getByTestId('tooltip-content-b')

    await expect(contentB).toHaveCount(0)

    await btnB.hover()
    await expect(contentB).toBeVisible()
    await expect(contentB).toHaveText('Help text for Button B')
    await expectAnchoredTop(btnB, contentB)
    await page.waitForTimeout(200)
    await snap(page, 'hover-open-btn-b')
  })

  test('TT-POS: focused tooltip is anchored to the trigger, not hardcoded', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await btnA.focus()
    await expect(contentA).toBeVisible()
    await expectAnchoredTop(btnA, contentA)

    const inline = await contentA.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))
    expect(inline.position === 'absolute' || inline.position === 'fixed').toBe(true)
    expect(inline.top).toMatch(/px$/)
    expect(inline.left).toMatch(/px$/)
    await page.waitForTimeout(200)
    await snap(page, 'anchored-top-btn-a')
  })

  test('TT-GROUP-01: Tooltip should request a neighbor immediately within the warm skip window', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Group')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-group-a')
    const btnB = page.getByTestId('btn-group-b')
    const contentA = page.getByTestId('tooltip-group-a')
    const contentB = page.getByTestId('tooltip-group-b')
    const away = page.getByTestId('btn-group-away')

    await btnA.hover()
    await expect(contentA).toHaveCount(0)
    await page.waitForTimeout(220)
    await expect(contentA).toBeVisible()
    await snap(page, 'group-a-open')

    await away.hover()
    await expect(contentA).toHaveCount(0)

    await btnB.hover()
    await expect(contentB).toBeVisible({ timeout: 150 })
    await expect(contentA).toHaveCount(0)
    await snap(page, 'group-b-open-warm')
  })

  test('TT-GROUP-02: Tooltip should close the current instance before requesting its neighbor', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Group')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-group-a')
    const btnB = page.getByTestId('btn-group-b')
    const contentA = page.getByTestId('tooltip-group-a')
    const contentB = page.getByTestId('tooltip-group-b')

    await btnA.hover()
    await page.waitForTimeout(220)
    await expect(contentA).toBeVisible()

    await btnB.hover()
    await expect(contentA).toHaveCount(0)
    await expect(contentB).toBeVisible({ timeout: 150 })
    await expect(page.locator('[role="tooltip"]')).toHaveCount(1)
  })

  test('TT-GROUP-03: Tooltip should return to cold delay when the skip window has expired', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Group')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-group-a')
    const btnB = page.getByTestId('btn-group-b')
    const contentA = page.getByTestId('tooltip-group-a')
    const contentB = page.getByTestId('tooltip-group-b')
    const away = page.getByTestId('btn-group-away')

    await btnA.hover()
    await page.waitForTimeout(220)
    await expect(contentA).toBeVisible()
    await away.hover()
    await expect(contentA).toHaveCount(0)

    await page.waitForTimeout(350)
    await btnB.hover()
    await page.waitForTimeout(120)
    await expect(contentB).toHaveCount(0)
    await page.waitForTimeout(120)
    await expect(contentB).toBeVisible()
  })

  test('TT-CLOSE-01: Tooltip should request one dismissal on Escape without closing a parent Overlay', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/NestedOverlay')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const dialog = page.getByTestId('dialog-content')
    const trigger = page.getByTestId('nested-tooltip-trigger')
    const tip = page.getByTestId('nested-tooltip-content')

    await page.getByTestId('dialog-trigger').click()
    await expect(dialog).toBeVisible()

    await trigger.focus()
    await expect(tip).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'nested-dialog-tooltip-open')

    await page.keyboard.press('Escape')
    await expect(tip).toHaveCount(0)
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'nested-dialog-tooltip-dismissed')
  })

  test('TT-CLOSE-03: Tooltip should dismiss and suppress hover reopening when its open Trigger is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await btnA.hover()
    await expect(contentA).toBeVisible()

    await btnA.click()
    await expect(contentA).toHaveCount(0)
    await page.waitForTimeout(80)
    await expect(contentA).toHaveCount(0)

    await page.getByTestId('btn-outside').hover()
    await btnA.hover()
    await expect(contentA).toBeVisible()
  })

  test('TT-SCROLL-01: Tooltip should request close once when an ancestor scroll moves its Trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Scroll')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const ancestor = page.getByTestId('tooltip-scroll-ancestor')
    const trigger = page.getByTestId('btn-scroll-tooltip')
    const content = page.getByTestId('tooltip-scroll-content')

    await trigger.hover()
    await expect(content).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'scroll-ancestor-open')

    await ancestor.evaluate((el: HTMLElement) => {
      el.scrollTop += 40
    })
    await expect(content).toHaveCount(0)
  })

  test('TT-SCROLL-03: Tooltip should remain open when scrolling occurs inside an input or textarea Trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Scroll')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const field = page.getByTestId('tooltip-textarea')
    const content = page.getByTestId('tooltip-textarea-content')

    await field.hover()
    await expect(content).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'scroll-textarea-open')

    await field.evaluate((el: HTMLTextAreaElement) => {
      el.scrollTop = 40
      el.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    await expect(content).toBeVisible()
  })

  test('Component story: HoverTrigger', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip/HoverTrigger')
    const button = page.getByRole('button', { name: 'Hover tooltip trigger' })
    await expect(button).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'story-hover-trigger-resting')

    await button.hover()
    await page.waitForTimeout(200)
    const tip = page.getByText('Helpful tooltip information')
    await expect(tip).toBeVisible()
    await snap(page, 'story-hover-trigger-open')
  })

  test('Component story: KeyboardFocus', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip/KeyboardFocus')
    const button = page.getByRole('button', { name: 'Keyboard focus trigger' })
    await expect(button).toBeVisible()

    await button.focus()
    await page.waitForTimeout(200)
    const tip = page.getByText('Appears on keyboard focus')
    await expect(tip).toBeVisible()
    await snap(page, 'story-keyboard-focus-open')
  })
})
