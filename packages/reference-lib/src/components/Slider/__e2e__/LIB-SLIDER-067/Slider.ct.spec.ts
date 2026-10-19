/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider pins', () => {
  test('SD-POINTER-02: resolves stacked track presses by the active/index rule', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/Slider/Slider/LoggedFixture', { initial: [40, 40], width: 100 })
    const track = page.getByTestId('logged-track')
    const thumb0 = page.getByTestId('logged-thumb-0')
    const thumb1 = page.getByTestId('logged-thumb-1')
    const changes = page.getByTestId('logged-changes')
    let box = await track.boundingBox()
    expect(box).not.toBeNull()

    // Real stack press before any thumb is active: the lower index paints on
    // top and takes the press; a thumb press emits nothing on its own.
    await page.mouse.click(box!.x + 40, box!.y + box!.height / 2)
    await expect(thumb0).toBeFocused()
    await expect(changes).toHaveText('[]')

    // Activate index 1, move focus outside, press the stack again: index 1 wins.
    await thumb1.focus()
    await expect(thumb1).toBeFocused()
    await page.mouse.click(5, 5)
    await expect(thumb1).not.toBeFocused()
    box = await track.boundingBox()
    await page.mouse.click(box!.x + 40, box!.y + box!.height / 2)
    await expect(thumb1).toBeFocused()

    // Below/above the stack select only a thumb that can move toward the press.
    await first.unmount()
    const second = await mount('components/Slider/Slider/LoggedFixture', { initial: [40, 40], width: 100 })
    const track2 = page.getByTestId('logged-track')
    const box2 = await track2.boundingBox()
    await track2.click({ position: { x: 10, y: box2!.height / 2 } })
    await expect(page.getByTestId('logged-thumb-0')).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[10,40]]')

    await second.unmount()
    await mount('components/Slider/Slider/LoggedFixture', { initial: [40, 40], width: 100 })
    const track3 = page.getByTestId('logged-track')
    const box3 = await track3.boundingBox()
    await track3.click({ position: { x: 90, y: box3!.height / 2 } })
    await expect(page.getByTestId('logged-thumb-1')).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[40,90]]')
  })
});
