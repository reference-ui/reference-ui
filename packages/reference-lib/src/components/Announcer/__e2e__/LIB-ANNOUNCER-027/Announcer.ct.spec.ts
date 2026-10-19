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

test('ANN-LIVE-03 / TO-ANN-05: same message twice produces two observable insertions', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-repeat').click()
  await page.waitForFunction(
    () =>
      ((window as unknown as { __annLog?: string[] }).__annLog ?? []).filter(
        e => e === 'polite:Saved'
      ).length >= 2,
    { timeout: 5000 }
  )
  const entries = (await annLog(page)).filter(e => e === 'polite:Saved' || e === 'polite:')
  const first = entries.indexOf('polite:Saved')
  const last = entries.lastIndexOf('polite:Saved')
  expect(first).toBeGreaterThanOrEqual(0)
  expect(last).toBeGreaterThan(first)
  expect(entries.slice(first, last)).toContain('polite:')
})
