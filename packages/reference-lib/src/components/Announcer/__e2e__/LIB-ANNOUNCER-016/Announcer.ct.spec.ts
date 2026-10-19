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

test('announcer story announces polite and assertive into independent live regions', async ({
  mount,
  page,
}) => {
  await mount('components/Announcer/Announcer/AnnouncerFixture')
  await expect(page.getByTestId('announcer-fixture-root')).toBeVisible()

  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  await page.getByTestId('btn-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Polite message #1')
  await expect(page.getByTestId('readout-polite')).toHaveText('Polite message #1')

  await page.getByTestId('btn-announce-assertive').click()
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText(
    'Assertive message #1'
  )
  await expect(page.getByTestId('readout-assertive')).toHaveText('Assertive message #1')

  // Independent channels: assertive traffic leaves polite untouched.
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Polite message #1')

  // Every insertion was an observable DOM mutation.
  const mutations = await page.getByTestId('readout-mutations').textContent()
  expect(Number(mutations)).toBeGreaterThan(0)
})
