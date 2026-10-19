/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-SCROLL-09: Content in Shadow DOM can scroll while background cannot', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-scroll-09').click()
    const content = page.getByTestId('scroll-09-content')
    await expect(content).toBeVisible()

    const before = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="scroll09-host"]') as HTMLElement
      const bg = host.shadowRoot?.querySelector('[data-testid="scroll09-bg"]') as HTMLElement | null
      return { bg: bg?.scrollTop ?? -1, y: window.scrollY }
    })

    await content.evaluate(el => {
      el.scrollTop = 40
    })
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="scroll09-host"]') as HTMLElement
      const bg = host.shadowRoot?.querySelector('[data-testid="scroll09-bg"]') as HTMLElement | null
      bg?.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true, composed: true }))
    })

    const after = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="scroll09-host"]') as HTMLElement
      const bg = host.shadowRoot?.querySelector('[data-testid="scroll09-bg"]') as HTMLElement | null
      const dest = host.shadowRoot?.querySelector('[data-testid="scroll09-dest"]') as HTMLElement | null
      const inner = dest?.querySelector('[data-testid="scroll-09-content"]') as HTMLElement | null
      return { bg: bg?.scrollTop ?? -1, inner: inner?.scrollTop ?? -1, y: window.scrollY }
    })
    expect(after.inner).toBeGreaterThan(0)
    expect(after.bg).toBe(before.bg)
    expect(after.y).toBe(before.y)
  })
})
