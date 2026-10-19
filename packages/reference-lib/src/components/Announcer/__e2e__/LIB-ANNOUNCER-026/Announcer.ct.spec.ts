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

test('ANN-LIVE-02 / TO-ANN-02: same-turn polite and assertive are both preserved', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-both').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText(
    'Background sync complete'
  )
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('Session expired')
  const log = await annLog(page)
  expect(log).toContain('polite:Background sync complete')
  expect(log).toContain('assertive:Session expired')
})
