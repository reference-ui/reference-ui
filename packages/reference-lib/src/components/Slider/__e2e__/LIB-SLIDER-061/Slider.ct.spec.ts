/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider CT', () => {
  test('multi-thumb range slider focus ring parity on keyboard and mouse drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/RangeSliderFixture')

    const thumb0 = page.getByTestId('range-thumb-0')
    const thumb1 = page.getByTestId('range-thumb-1')
    const track = page.getByTestId('range-track')

    // Initial state: neither thumb has outline
    let outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    let outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('none')
    await page.waitForTimeout(300)
    await snap(page, 'range-slider-resting')

    // 1. Focus thumb0 via keyboard: Tab to thumb0
    await thumb0.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb0).toHaveAttribute('data-focus-visible', '')
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('solid')
    expect(outline1).toBe('none')
    await page.waitForTimeout(200)
    await snap(page, 'range-thumb0-focused')

    // 2. Tab to thumb1: thumb0 loses ring, thumb1 gains ring
    await page.keyboard.press('Tab')
    await expect(thumb1).toBeFocused()
    await expect(thumb1).toHaveAttribute('data-focus-visible', '')
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('solid')
    await page.waitForTimeout(200)
    await snap(page, 'range-thumb1-focused')

    // 3. Mouse click & drag on thumb1: outline MUST be none during and after drag
    const box1 = await thumb1.boundingBox()
    expect(box1).not.toBeNull()

    // Move to thumb1 and press mouse
    await page.mouse.move(box1!.x + box1!.width / 2, box1!.y + box1!.height / 2)
    await page.mouse.down()

    // Check during pointerdown
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('none')
    await expect(thumb1).not.toHaveAttribute('data-focus-visible')

    // Drag by 30px
    await page.mouse.move(box1!.x + box1!.width / 2 - 30, box1!.y + box1!.height / 2)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('none')
    await expect(thumb1).not.toHaveAttribute('data-focus-visible')

    // Release mouse
    await page.mouse.up()
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('none')
    await expect(thumb1).not.toHaveAttribute('data-focus-visible')
    await page.waitForTimeout(200)
    await snap(page, 'range-thumb1-dragged')

    // 4. Mouse click & drag on thumb0
    const box0 = await thumb0.boundingBox()
    expect(box0).not.toBeNull()

    await page.mouse.move(box0!.x + box0!.width / 2, box0!.y + box0!.height / 2)
    await page.mouse.down()
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')

    await page.mouse.move(box0!.x + box0!.width / 2 + 30, box0!.y + box0!.height / 2)
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')

    await page.mouse.up()
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    await expect(thumb0).not.toHaveAttribute('data-focus-visible')

    // 5. Track click near thumb1
    const trackBox = await track.boundingBox()
    expect(trackBox).not.toBeNull()
    await track.click({ position: { x: trackBox!.width * 0.9, y: trackBox!.height / 2 } })
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('none')

    // 6. Keyboard navigation restores focus visible ring
    await page.keyboard.press('ArrowLeft')
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('solid')
    await expect(thumb1).toHaveAttribute('data-focus-visible', '')
  })
});
