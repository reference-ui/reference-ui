/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

async function clickPopoverChrome(page: Page, popover: Locator) {
  const box = await popover.boundingBox()
  const firstOption = popover.locator('[role="option"]').first()
  const optBox = await firstOption.boundingBox()
  expect(box).toBeTruthy()
  expect(optBox).toBeTruthy()
  const gap = optBox!.y - box!.y
  expect(gap).toBeGreaterThan(0)
  await page.mouse.click(box!.x + 3, box!.y + gap / 2)
}

test.describe('Combobox CT', () => {
  test('CB-ENV-03: shadow-root portal destination, focus, scroll, composed paths, ordered callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ShadowLog')

    const host = page.getByTestId('sh-host')
    const input = page.getByTestId('sh-input')
    const popover = page.getByTestId('sh-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // The popover portals into the focus source's ShadowRoot, not body.
    expect(
      await host.evaluate(
        el => !!el.shadowRoot?.querySelector('[data-testid="sh-popover"]')
      )
    ).toBe(true)
    expect(
      await page.evaluate(
        () => !!document.querySelector('[data-testid="sh-popover"]')
      )
    ).toBe(false)

    // Focus is discovered in the owning root.
    expect(
      await host.evaluate(
        el =>
          ((el.shadowRoot?.activeElement ?? null) as HTMLElement | null)?.getAttribute(
            'data-testid'
          ) ?? null
      )
    ).toBe('sh-input')

    // Navigate beyond the window: active IDs resolve in the same root and
    // scroll correction stays inside the popover.
    await page.mouse.move(6, 6)
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowDown')
    }
    const target = page.getByTestId('sh-opt-opt-11')
    await expectActiveDescendant(input, target)
    const descId = await input.getAttribute('aria-activedescendant')
    expect(descId).toBeTruthy()
    expect(await host.evaluate((el, id) => !!el.shadowRoot?.getElementById(id!), descId)).toBe(
      true
    )
    await expect(target).toBeInViewport()
    const listScrollTop = await popover
      .locator('[role="listbox"]')
      .evaluate(el => (el as HTMLElement).scrollTop)
    expect(listScrollTop).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    // Typing resets active to the first match; Enter commits with the exact
    // ordered callback sequence a cross-engine run compares against.
    await page.keyboard.type('x')
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'sh-log')).toEqual([
      'open',
      'input:x',
      'change:opt-00',
      'dismiss',
    ])
    await expect(popover).toHaveCount(0)

    // Composed inside paths stay open with no extra callbacks.
    await input.click()
    await expect(popover).toBeVisible()
    await clickPopoverChrome(page, popover)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(await readLog(page, 'sh-log')).toEqual([
      'open',
      'input:x',
      'change:opt-00',
      'dismiss',
      'open',
    ])

    // A true outside path dismisses exactly once.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'sh-log')).toEqual([
      'open',
      'input:x',
      'change:opt-00',
      'dismiss',
      'open',
      'dismiss',
    ])
  })
});
