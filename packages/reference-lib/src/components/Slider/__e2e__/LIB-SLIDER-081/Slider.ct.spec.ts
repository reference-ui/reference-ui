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
  test('SD-DYNAMIC-03: discards stale drag state on mid-gesture cardinality change', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/CardinalityFixture')
    const track = page.getByTestId('cardinality-track')
    const trackBox = await track.boundingBox()
    expect(trackBox).not.toBeNull()

    // Shrink mid-drag: later moves and the release stay silent.
    let tbox = await page.getByTestId('cardinality-thumb-2').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="cardinality-shrink"]') as HTMLElement).click()
    })
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.9, trackBox!.y + trackBox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[]')
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[]')

    // Grow mid-drag: the old release commits nothing.
    tbox = await page.getByTestId('cardinality-thumb-1').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.4, trackBox!.y + trackBox!.height / 2)
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[[10,40]]')
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="cardinality-grow"]') as HTMLElement).click()
    })
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.5, trackBox!.y + trackBox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[[10,40]]')
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[]')

    // A new index-2 drag requests normally after the growth.
    tbox = await page.getByTestId('cardinality-thumb-2').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox!.x + trackBox!.width, trackBox!.y + trackBox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[[10,40],[10,20,100]]')
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[[10,20,100]]')
  })
});
