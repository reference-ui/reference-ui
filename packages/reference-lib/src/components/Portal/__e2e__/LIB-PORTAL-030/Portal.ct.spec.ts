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

  test('PT-COMP-02: Scoped overlay root composition resolves late, inherits scope, and stays stable', async ({
    page,
  }) => {
    // Pre-resolve: nothing anywhere, no transient body copy.
    for (const id of ['coverage-scoped-styled', 'coverage-scoped-btn']) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
    expect(
      await page.evaluate(
        () =>
          document.body.querySelectorAll(
            '[data-testid="coverage-scoped-styled"],[data-testid="coverage-scoped-btn"]'
          ).length
      )
    ).toBe(0)

    // Clear the COMP-01 body-level composition first: it paints over this
    // section's controls in the gallery's stacked viewports and would
    // otherwise intercept the mount click. (Control click via DOM dispatch;
    // the portalled button below keeps a real pointer click.)
    await page
      .getByTestId('btn-coverage-comp1-unmount')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('coverage-comp1-btn')).toHaveCount(0)

    await page.getByTestId('btn-coverage-scoped-mount').click()
    const root = page.getByTestId('coverage-scoped-root')
    await expect(root.getByTestId('coverage-scoped-btn')).toBeVisible()

    // One subtree in the scoped root; scoped styling inherited via DOM placement.
    expect(await root.evaluate(el => el.childElementCount)).toBe(2)
    expect(
      await page
        .getByTestId('coverage-scoped-styled')
        .evaluate(el => window.getComputedStyle(el).color)
    ).toBe('rgb(11, 22, 33)')
    await expect(page.getByTestId('coverage-scoped-styled')).toHaveAttribute(
      'data-context-val',
      'logical-provider-value'
    )

    // Logical React event bubbling.
    await page.getByTestId('coverage-scoped-btn').click()
    await expect(page.getByTestId('coverage-scoped-clicks')).toHaveText('1')
    // No snap(): unstyled coverage chrome — the DOM assertions above are the proof.

    // Unrelated parent state: stable subtree, no remount. The gallery mounts
    // in StrictMode (dev double-effects), so settle is relational — one live
    // subscription — and stability is capture-compare, not an absolute count.
    await expect
      .poll(async () => {
        const m = Number(await page.getByTestId('coverage-scoped-mounts').textContent())
        const c = Number(await page.getByTestId('coverage-scoped-cleanups').textContent())
        return m >= 1 && c === m - 1
      })
      .toBe(true)
    const mountsBefore = await page.getByTestId('coverage-scoped-mounts').textContent()
    await page
      .getByTestId('coverage-scoped-styled')
      .evaluate(el => el.setAttribute('data-same-node', 'true'))
    await page.getByTestId('btn-coverage-unrelated').click()
    await page.getByTestId('btn-coverage-unrelated').click()
    await expect(page.getByTestId('coverage-scoped-mounts')).toHaveText(mountsBefore ?? '1')
    expect(await page.getByTestId('coverage-scoped-styled').getAttribute('data-same-node')).toBe(
      'true'
    )
    expect(await root.evaluate(el => el.childElementCount)).toBe(2)
  })
});
