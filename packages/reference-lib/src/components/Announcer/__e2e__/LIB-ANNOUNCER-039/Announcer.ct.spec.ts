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

test('ANN-OV-01: announcer stays non-inert under an isolating Overlay', async ({ mount, page }) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()
  await page.getByTestId('btn-ovm-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')

  const isolation = await page.evaluate(() => {
    const flags = (el: Element | null) => ({
      inert: el?.hasAttribute('inert') ?? false,
      managed: el?.hasAttribute('data-overlay-managed-inert') ?? false,
      ariaHidden: el?.getAttribute('aria-hidden') ?? null,
    })
    // inert is inherited: a node under an inert ancestor is isolated too.
    const inertAncestor = (el: Element | null) => {
      let parent = el?.parentElement ?? null
      while (parent) {
        if (parent.hasAttribute('inert')) return true
        parent = parent.parentElement
      }
      return false
    }
    const host = document.querySelector('[data-reference-announcer-host]')
    const regions = [...document.querySelectorAll('[data-reference-announcer]')]
    const sibling = document.querySelector('[data-testid="ov-sibling"]')
    return {
      host: { ...flags(host), inertAncestor: inertAncestor(host) },
      regions: regions.map(el => ({ ...flags(el), inertAncestor: inertAncestor(el) })),
      sibling: { ...flags(sibling), inertAncestor: inertAncestor(sibling) },
    }
  })
  expect(isolation.host).toEqual({ inert: false, managed: false, ariaHidden: null, inertAncestor: false })
  expect(isolation.regions).toEqual([
    { inert: false, managed: false, ariaHidden: null, inertAncestor: false },
    { inert: false, managed: false, ariaHidden: null, inertAncestor: false },
  ])
  expect(
    isolation.sibling.inert || isolation.sibling.managed || isolation.sibling.inertAncestor
  ).toBe(true)
})
