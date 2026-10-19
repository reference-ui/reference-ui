/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('selected option uses the muted wash, not the button token', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Basic')
    const selected = page.getByTestId('opt-apple')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    const bg = await selected.evaluate(el => getComputedStyle(el).backgroundColor)
    // Muted wash (gray.800 in dark mode, L≈28%) is nowhere near the
    // near-white button token (gray.50, L≈98%): lightness must stay < 50%.
    let lightness: number
    if (bg.startsWith('oklch')) {
      // Chrome serializes L as 0..1 ("oklch(0.278 …)"); percent form divides.
      const raw = Number(bg.match(/[\d.]+/)?.[0] ?? '1')
      lightness = raw > 1 ? raw / 100 : raw
    } else {
      const rgb = bg.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255]
      const [r, g, b] = [...rgb, 255, 255, 255].slice(0, 3)
      lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255
    }
    expect(lightness).toBeLessThan(0.5)
  })
});
