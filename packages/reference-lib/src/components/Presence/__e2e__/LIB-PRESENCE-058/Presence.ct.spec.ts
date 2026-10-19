/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence GSAP extension', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceGsapFixture')
  })

  test('PR-GSAP-01: Retains an exiting child until its finite GSAP tweens complete, and skips the wait under reduced motion', async ({
    page,
  }) => {
    await page.waitForFunction(() => !!(window as any).__presenceGsap)
    // Collapsible's exit shape: a GSAP-owned tween on the observed node with
    // no CSS effect. Presence must hold the child until the tween finishes.
    await page.evaluate(() => {
      const gsap = (window as any).__presenceGsap
      gsap.to('[data-testid="gsap-box"]', { opacity: 0, duration: 0.4, ease: 'none' })
    })
    await page.getByTestId('btn-toggle-gsap').click()
    const box = page.getByTestId('gsap-box')
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('gsapcount')).toHaveText('1')

    // Reduced motion gates the GSAP wait off: same tween, instant removal.
    const btn = page.getByTestId('btn-toggle-gsap')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(box).toBeVisible()
    await page.evaluate(() => {
      const orig = window.matchMedia.bind(window)
      window.matchMedia = ((query: string) => {
        if (query.includes('prefers-reduced-motion')) {
          return {
            matches: true,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
          }
        }
        return orig(query)
      }) as unknown as typeof window.matchMedia
      const gsap = (window as any).__presenceGsap
      gsap.to('[data-testid="gsap-box"]', { opacity: 0, duration: 0.4, ease: 'none' })
    })
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    const absent = await page.evaluate(() => !document.querySelector('[data-testid="gsap-box"]'))
    expect(absent).toBe(true)
    await expect(page.getByTestId('gsapcount')).toHaveText('2')
  })
});
