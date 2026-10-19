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

test('ANN-DOM-02: host is clipped 1x1 without aria-hidden; AT visibility is the live attributes', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  const dom = await page.evaluate(() => {
    const host = document.querySelector('[data-reference-announcer-host]') as HTMLElement | null
    const regions = [...document.querySelectorAll('[data-reference-announcer]')] as HTMLElement[]
    const style = host ? getComputedStyle(host) : null
    return {
      hostStyle: style
        ? {
            position: style.position,
            width: style.width,
            height: style.height,
            overflow: style.overflow,
            clip: style.clip,
          }
        : null,
      ariaHidden: [host, ...regions].map(el => el?.getAttribute('aria-hidden') ?? null),
    }
  })
  expect(dom.hostStyle).toMatchObject({
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  })
  expect(dom.hostStyle?.clip.startsWith('rect(')).toBe(true)
  expect(dom.ariaHidden).toEqual([null, null, null])

  // The proof is the live attributes, not a Playwright visibility bounding box.
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveAttribute(
    'aria-live',
    'polite'
  )
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveAttribute(
    'aria-live',
    'assertive'
  )
})
