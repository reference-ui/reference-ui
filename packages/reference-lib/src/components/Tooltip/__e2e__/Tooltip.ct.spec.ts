import { test, expect, snap } from '../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../playwright/axe'
import type { Locator } from '@playwright/test'

async function expectAnchoredTop(trigger: Locator, content: Locator) {
  await expect(async () => {
    const triggerBox = await trigger.boundingBox()
    const contentBox = await content.boundingBox()
    expect(triggerBox).toBeTruthy()
    expect(contentBox).toBeTruthy()

    expect(contentBox!.y + contentBox!.height).toBeLessThanOrEqual(triggerBox!.y + 2)
    expect(contentBox!.y + contentBox!.height).toBeGreaterThan(triggerBox!.y - 32)

    const triggerMid = triggerBox!.x + triggerBox!.width / 2
    expect(contentBox!.x).toBeLessThan(triggerMid)
    expect(contentBox!.x + contentBox!.width).toBeGreaterThan(triggerMid)
  }).toPass()
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

    // TT-FOCUS-01: honest keyboard Tab (not programmatic focus) — ring + tip together.
    await page.keyboard.press('Tab')
    await expect(btnA).toBeFocused()
    await expect(btnA).toHaveAttribute('data-focus-visible', '')

    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expect(contentA).toHaveText('Help text for Button A')

    const contentId = await contentA.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(btnA).toHaveAttribute('aria-describedby', contentId!)
    await page.waitForTimeout(200)
    await snap(page, 'focus-open-btn-a')

    // Tab off via btn-tooltip-b onto the outside control; blur closes unconditionally.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('btn-outside')).toBeFocused()
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

    // Honest keyboard Tab (not programmatic focus); anchoring assertions untouched.
    await page.keyboard.press('Tab')
    await expect(btnA).toBeFocused()
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

    // Mouse-opened dialog autofocus must NOT pop the tip (TT-FOCUS-03 regression).
    await expect(trigger).toBeFocused()
    await expect(tip).toHaveCount(0)

    // Single-tabbable trap wraps Tab to self (no focus event), so blur out and
    // Tab back in: the open below is an honest keyboard Tab with a ring.
    await trigger.evaluate(el => (el as HTMLElement).blur())
    await page.keyboard.press('Tab')
    await expect(trigger).toBeFocused()
    await expect(tip).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'nested-dialog-tooltip-open')

    await page.keyboard.press('Escape')
    await expect(tip).toHaveCount(0)
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'nested-dialog-tooltip-dismissed')
  })

  test('TT-FOCUS-03: Tooltip should stay shut on mouse-opened dialog autofocus, then open on Tab with a ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/NestedOverlay')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const dialog = page.getByTestId('dialog-content')
    const trigger = page.getByTestId('nested-tooltip-trigger')
    const tip = page.getByTestId('nested-tooltip-content')

    // Mouse-click dialog open: focus correctly moves inside (APG), tip stays shut.
    await page.getByTestId('dialog-trigger').click()
    await expect(dialog).toBeVisible()
    await expect(trigger).toBeFocused()
    await expect(trigger).not.toHaveAttribute('data-focus-visible')
    await expect(tip).toHaveCount(0)

    // Focus away and back via a real Tab: tip opens WITH the ring (TT-FOCUS-01).
    // (Single-tabbable trap wraps Tab to self, so the "away" leg is a blur;
    // the "back" leg is the honest keyboard Tab through the trap.)
    await trigger.evaluate(el => (el as HTMLElement).blur())
    await page.keyboard.press('Tab')
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('data-focus-visible', '')
    await expect(tip).toBeVisible()
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

    // The story is named KeyboardFocus: make it honest with a real Tab.
    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute('data-focus-visible', '')
    await page.waitForTimeout(200)
    const tip = page.getByText('Appears on keyboard focus')
    await expect(tip).toBeVisible()
    await snap(page, 'story-keyboard-focus-open')
  })

  test('B-09: Span inside default Tooltip.Content inherits a legible color with zero overrides', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/SpanInDefaultContent')

    const trigger = page.getByTestId('btn-span-tip')
    const content = page.getByTestId('tooltip-span-content')
    const span = page.getByTestId('tooltip-span-text')

    await trigger.hover()
    await expect(content).toBeVisible()
    await expect(span).toBeVisible()
    await expect(span).toHaveText('Helpful tooltip information')

    const colors = await span.evaluate(el => {
      const own = getComputedStyle(el)
      const parent = getComputedStyle(el.parentElement!)
      return { color: own.color, parentColor: parent.color, parentBg: parent.backgroundColor }
    })
    // Inheritance: Span must take the chip's foreground, not pin body text.
    expect(colors.color).toBe(colors.parentColor)
    // Legibility: WCAG AA contrast against the chip background.
    expect(contrastRatio(colors.color, colors.parentBg)).toBeGreaterThanOrEqual(4.5)
  })

  test('TT-A11Y-01 scan: axe reports zero violations on the open tooltip', async ({
    mount,
    page,
  }) => {
    // Scanner half of TT-A11Y-01 (assertion half is TT-DOM-01/02's
    // role/describedby/content checks): Basic exercises a generated
    // descriptor ID plus keyboard-opened Content in one mount.
    // Whole-page scope: Content portals to document.body, so
    // #root-scoping would miss component-owned content; the gallery
    // holds one story per mount.
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()
    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')
    await page.keyboard.press('Tab')
    await expect(btnA).toBeFocused()
    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expectNoAxeViolations(page)
  })
})

function relativeLuminance(color: string): number {
  const linear = toLinearRgb(color)
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function toLinearRgb(color: string): [number, number, number] {
  if (color.startsWith('oklch(')) {
    const [lRaw, cRaw, hRaw] = color
      .replace(/^oklch\(/, '')
      .replace(/\)$/, '')
      .trim()
      .split(/\s+/)
    const l = lRaw!.endsWith('%') ? Number(lRaw!.slice(0, -1)) / 100 : Number(lRaw)
    const c = Number(cRaw)
    const h = (Number((hRaw ?? '0').replace(/deg$/, '')) * Math.PI) / 180
    const a = c * Math.cos(h)
    const b = c * Math.sin(h)
    const lms: [number, number, number] = [
      l + 0.3963377774 * a + 0.2158037573 * b,
      l - 0.1055613458 * a - 0.0638541728 * b,
      l - 0.0894841775 * a - 1.291485548 * b,
    ]
    const [lc, mc, sc] = lms.map(v => v * v * v)
    return [
      Math.max(0, 4.0767416621 * lc! - 3.3077115913 * mc! + 0.2309699292 * sc!),
      Math.max(0, -1.2684380046 * lc! + 2.6097574011 * mc! - 0.3413193965 * sc!),
      Math.max(0, -0.0041960863 * lc! - 0.7034186147 * mc! + 1.707614701 * sc!),
    ]
  }
  const [r, g, b] = color
    .replace(/^rgba?\(/, '')
    .replace(/\)$/, '')
    .split(',')
    .slice(0, 3)
    .map(part => {
      const s = Number(part.trim()) / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
  return [r!, g!, b!]
}

function contrastRatio(fg: string, bg: string): number {
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg))
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg))
  return (lighter + 0.05) / (darker + 0.05)
}
