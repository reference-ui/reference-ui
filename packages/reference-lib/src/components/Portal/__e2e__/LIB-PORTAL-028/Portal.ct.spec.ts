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

  test('PT-DOM-07: Keyed child updates in place; siblings add/remove singly; unmount leaves no orphans', async ({
    page,
  }) => {
    const dest = page.getByTestId('coverage-update-dest')
    const keyed = dest.getByTestId('coverage-update-keyed')
    await expect(keyed).toHaveText('v1')

    await keyed.evaluate(el => el.setAttribute('data-same-node', 'true'))
    await page.getByTestId('btn-coverage-update-text').click()
    await expect(keyed).toHaveText('v2')
    expect(await keyed.getAttribute('data-text')).toBe('v2')
    expect(await keyed.getAttribute('data-same-node')).toBe('true')

    await page.getByTestId('btn-coverage-add-sibling').click()
    await expect(dest.getByTestId('coverage-update-sibling')).toBeVisible()
    expect(await dest.evaluate(el => el.childElementCount)).toBe(2)

    await page.getByTestId('btn-coverage-remove-sibling').click()
    await expect(dest.getByTestId('coverage-update-sibling')).toHaveCount(0)
    expect(await dest.evaluate(el => el.childElementCount)).toBe(1)

    await page.getByTestId('btn-coverage-update-unmount').click()
    await expect(keyed).toHaveCount(0)
    expect(await dest.evaluate(el => el.childNodes.length)).toBe(0)
  })
});
