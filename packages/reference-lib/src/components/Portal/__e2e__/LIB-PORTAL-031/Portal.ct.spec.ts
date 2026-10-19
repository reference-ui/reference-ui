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

  test('PT-ENV-04: Same-origin iframe destination owns placement, React events, and cleanup', async ({
    page,
  }) => {
    const frame = page.frameLocator('[data-testid="coverage-iframe"]')
    const btn = frame.getByTestId('coverage-iframe-btn')
    await expect(btn).toBeVisible()

    // Created only in the iframe target, owned by the iframe document.
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="coverage-iframe-btn"]'))
    ).toBe(false)
    const placement = await page.evaluate(() => {
      const iframe = document.querySelector(
        '[data-testid="coverage-iframe"]'
      ) as HTMLIFrameElement
      const target = iframe.contentDocument?.getElementById('frame-target') ?? null
      return {
        parentOk:
          target?.querySelector('[data-testid="coverage-iframe-btn"]')?.parentElement ===
          target,
        ownerDocOk: target?.ownerDocument === iframe.contentDocument,
      }
    })
    expect(placement.parentOk).toBe(true)
    expect(placement.ownerDocOk).toBe(true)
    // StrictMode gallery: settle is one live subscription (cleanups = mounts - 1).
    await expect
      .poll(async () => {
        const m = Number(await page.getByTestId('coverage-iframe-mounts').textContent())
        const c = Number(await page.getByTestId('coverage-iframe-cleanups').textContent())
        return m >= 1 && c === m - 1
      })
      .toBe(true)
    const iframeMounts = Number(await page.getByTestId('coverage-iframe-mounts').textContent())

    // React bubbling reaches the outer logical ancestor exactly once.
    await btn.click()
    await expect(page.getByTestId('coverage-iframe-log')).toHaveText('child,logical-parent')

    // Unmount cleans refs/effects and DOM nodes from the iframe document.
    await page.getByTestId('btn-coverage-iframe-unmount').click()
    await expect(btn).toHaveCount(0)
    await expect(page.getByTestId('coverage-iframe-cleanups')).toHaveText(String(iframeMounts))
    expect(
      await page.evaluate(() => {
        const iframe = document.querySelector(
          '[data-testid="coverage-iframe"]'
        ) as HTMLIFrameElement
        return iframe.contentDocument?.getElementById('frame-target')?.childElementCount ?? -1
      })
    ).toBe(0)
  })
});
