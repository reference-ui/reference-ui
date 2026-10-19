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

test('ANN-API-02 / ANN-LIVE-01 / TO-ANN-01: omitted politeness inserts one polite message and no toast', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()
  const polite = page.locator('[data-reference-announcer="polite"]')
  const assertive = page.locator('[data-reference-announcer="assertive"]')

  await page.getByTestId('btn-ann-polite').click()
  await expect(polite).toHaveText('Saved')
  await expect(assertive).toHaveText('')
  await expect(page.locator('[data-reference-toast-id]')).toHaveCount(0)
  expect(await annLog(page)).toContain('polite:Saved')
})
