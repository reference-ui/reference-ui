/**
 * Announcer browser proofs: API routing, live-region DOM, live speech,
 * lifecycle replay, and Overlay exemption rows. Mounts the story
 * fixtures and asserts AT-observable insertions, never toast visuals.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../../../../playwright/ct'

const PROBE = 'components/Announcer/Announcer/AnnouncerProbe'
const LIFECYCLE = 'components/Announcer/Announcer/AnnouncerLifecycle'
const STRICT = 'components/Announcer/Announcer/AnnouncerStrictLifecycle'
const OVERLAY_FIXTURE = 'components/Announcer/Announcer/AnnouncerOverlayFixture'
const ELECTION = 'components/Announcer/Announcer/AnnouncerElection'
const MULTIDOC = 'components/Announcer/Announcer/AnnouncerMultiDoc'

/** AT-observable mutation log recorded by useAnnouncerLog in the story. */
async function annLog(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __annLog?: string[] }).__annLog ?? []
  )
}

test('ANN-DOM-03: live regions stay out of the tab order', async ({ mount, page, browserName }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  const tabIndexes = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reference-announcer-host], [data-reference-announcer]')].map(
      el => (el as HTMLElement).tabIndex
    )
  )
  expect(tabIndexes).toEqual([-1, -1, -1])

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.())
  const hits: string[] = []
  for (let i = 0; i < 16; i += 1) {
    await page.keyboard.press('Tab')
    hits.push(
      await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return 'body'
        if (
          (active as HTMLElement).closest?.(
            '[data-reference-announcer-host], [data-reference-announcer]'
          )
        ) {
          return 'ANNOUNCER'
        }
        return (active as HTMLElement).getAttribute('data-testid') ?? active.tagName
      })
    )
  }
  expect(hits).not.toContain('ANNOUNCER')
  // WebKit/Safari skips buttons in
  // sequential Tab (keyboard navigation off by default) and this probe's
  // tabbables are buttons, so the walk legitimately never leaves body.
  // The contract (regions unreachable via Tab) is proven above by the
  // tabIndex -1s + zero ANNOUNCER hits; the traversal-sanity leg is
  // Chromium/Firefox-only, and WebKit pins the platform walk instead.
  if (browserName === 'webkit') {
    expect(hits.every(h => h === 'body')).toBe(true)
  } else {
    expect(hits.filter(h => h !== 'body').length).toBeGreaterThan(0)
  }
})
