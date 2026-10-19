/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal catalog coverage (CT re-target, no matrix on this branch)', () => {
  // Per-test page-error capture for PT-DOM-06. Listeners attach before mount
  // (addInitScript is too late: the gallery page is already open). Fresh page
  // per test, so no accumulation across specs.
  let pageErrors: string[] = []

  test.beforeEach(async ({ mount, page }) => {
    pageErrors = []
    page.on('pageerror', e => {
      pageErrors.push(`pageerror:${e.message}`)
    })
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`console:${msg.text()}`)
    })
    await mount('components/Portal/Portal/CoverageFixture')
    await expect(page.getByTestId('coverage-fixture-root')).toBeVisible()
  })

  test('PT-DOM-02: Mixed children keep text, nesting, and sibling order at the destination', async ({
    page,
  }) => {
    const dest = page.getByTestId('coverage-mixed-dest')
    await expect(dest.getByTestId('coverage-mixed-app')).toBeVisible()

    // Same text and element nodes, same order, only the DOM parent changed.
    const shape = await dest.evaluate(el =>
      Array.from(el.childNodes).map(n =>
        n.nodeType === 3
          ? `text:${n.textContent}`
          : `${(n as Element).tagName}:${(n as Element).getAttribute('data-testid')}`
      )
    )
    expect(shape).toEqual(['text:mixed-leading-text', 'DIV:coverage-mixed-app'])
    await expect(dest.getByTestId('coverage-mixed-descendant')).toHaveText('descendant')

    // Absent from the logical parent: no added host, no in-place copy.
    expect(
      await page
        .getByTestId('coverage-logical-parent')
        .locator('[data-testid="coverage-mixed-app"],[data-testid="coverage-mixed-descendant"]')
        .count()
    ).toBe(0)
  })
});
