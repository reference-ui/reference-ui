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
  test('SD-END-01: summarizes a changed pointer interaction once on release', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 135, y)
    await page.mouse.move(box!.x + 180, y)
    await page.mouse.up()
    await expect(page.getByTestId('logged-changes')).toHaveText('[30,45,60]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[60]')

    // Release outside the track still ends exactly once, clamped to the bound.
    await first.unmount()
    const second = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const track2 = page.getByTestId('logged-track')
    const box2 = await track2.boundingBox()
    await page.mouse.move(box2!.x + 60, box2!.y + box2!.height / 2)
    await page.mouse.down()
    await page.mouse.move(700, 400)
    await page.mouse.up()
    await expect(page.getByTestId('logged-ends')).toHaveText('[100]')

    // Range sessions deliver the complete ordered array.
    await second.unmount()
    await mount('components/Slider/Slider/LoggedFixture', { initial: [20, 80], width: 300 })
    const track3 = page.getByTestId('logged-track')
    const box3 = await track3.boundingBox()
    await track3.click({ position: { x: 270, y: box3!.height / 2 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,90]]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[[20,90]]')
  })
});
