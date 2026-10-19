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

test('ANN-OV-02: live regions still receive mutations while hide-outside runs', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()

  await page.getByTestId('btn-ovm-announce-polite').click()
  await page.getByTestId('btn-ovm-announce-assertive').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('Urgent')
})
