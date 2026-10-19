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
  test('SD-ENV-02: keeps pointer sessions singular under StrictMode', async ({ mount, page }) => {
    const component = await mount('components/Slider/Slider/StrictFixture')
    const track = page.getByTestId('strict-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    // Double-mounted effects must not duplicate listeners: exact sequences.
    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 180, y)
    await page.mouse.up()
    await expect(page.getByTestId('strict-changes')).toHaveText('[30,60]')
    await expect(page.getByTestId('strict-ends')).toHaveText('[60]')

    // Unmount mid-tree is clean; a remount works.
    await component.unmount()
    await expect(page.getByTestId('strict-track')).toHaveCount(0)
    await mount('components/Slider/Slider/StrictFixture')
    await expect(page.getByTestId('strict-thumb')).toBeVisible()
  })
});
