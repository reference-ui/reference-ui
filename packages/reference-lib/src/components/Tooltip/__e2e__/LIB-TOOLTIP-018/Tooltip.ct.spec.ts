/**
 * Tooltip composition gates and browser proofs. Slotted Triggers gain
 * aria-describedby and show Content on focus and hover, the tip anchors
 * to its trigger, warm-group neighbors open instantly inside the skip
 * window and cold after it, and Escape dismisses once without closing a
 * parent Overlay.
 */
import { test, expect, snap, pressTab } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator } from '@playwright/test'

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

test.describe('Tooltip Composition Gates & Browser Proofs', () => {
  test('Span inside default Tooltip.Content inherits a legible color with zero overrides', async ({
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
});
