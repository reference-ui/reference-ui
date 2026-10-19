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

test('ANN-DOM-01: one host with two contract live regions, no testids, outside the toast host', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()
  const host = page.locator('[data-reference-announcer-host]')
  await expect(host).toHaveCount(1)
  await expect(host).toHaveAttribute('data-reference-overlay-ignore', '')

  const polite = page.locator('[data-reference-announcer="polite"]')
  const assertive = page.locator('[data-reference-announcer="assertive"]')
  await expect(polite).toHaveAttribute('role', 'status')
  await expect(polite).toHaveAttribute('aria-live', 'polite')
  await expect(polite).toHaveAttribute('aria-atomic', 'true')
  await expect(assertive).toHaveAttribute('role', 'alert')
  await expect(assertive).toHaveAttribute('aria-live', 'assertive')
  await expect(assertive).toHaveAttribute('aria-atomic', 'true')
  await expect(host.locator('[data-reference-announcer="polite"]')).toHaveCount(1)
  await expect(host.locator('[data-reference-announcer="assertive"]')).toHaveCount(1)
  await expect(
    page.locator('[data-reference-toast-host] [data-reference-announcer-host]')
  ).toHaveCount(0)

  // contract selectors are the only selectors in host output.
  await expect(host).not.toHaveAttribute('data-testid')
  await expect(host.locator('[data-testid]')).toHaveCount(0)
})
