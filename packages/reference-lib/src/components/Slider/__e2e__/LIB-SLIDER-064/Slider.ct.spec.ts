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
  test('SD-POINTER-10: maps physical pointer positions when orientation and direction vary', async ({
    mount,
    page,
  }) => {
    // Real clicks use 1px insets (exact border pixels fail hit testing and
    // belong to the parent); exact 0/100 edges are pinned in unit.
    // Horizontal LTR: x=1 -> 1, x=99 -> 99.
    let component = await mount('components/Slider/Slider/LoggedFixture', { initial: 50, width: 100 })
    let track = page.getByTestId('logged-track')
    let box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: 1, y: box!.height / 2 } })
    await track.click({ position: { x: box!.width - 1, y: box!.height / 2 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[1,99]')
    await component.unmount()

    // Horizontal RTL: x=1 -> 99, x=99 -> 1.
    component = await mount('components/Slider/Slider/LoggedFixture', { initial: 50, width: 100, dir: 'rtl' })
    track = page.getByTestId('logged-track')
    box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: 1, y: box!.height / 2 } })
    await track.click({ position: { x: box!.width - 1, y: box!.height / 2 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[99,1]')
    await component.unmount()

    // Vertical: y=bottom-1 -> 1, y=1 -> 99.
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 100,
    })
    track = page.getByTestId('logged-track')
    box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: box!.width / 2, y: box!.height - 1 } })
    await track.click({ position: { x: box!.width / 2, y: 1 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[1,99]')
  })
});
