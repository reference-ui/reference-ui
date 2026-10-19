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

test('ANN-LIFE-02: pending replay inserts into an already-mounted empty region', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-queue').click()
  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Ready')

  const log = await annLog(page)
  expect(log.filter(e => e.startsWith('added-polite:'))).toEqual(['added-polite:'])
  expect(log.indexOf('added-polite:')).toBeLessThan(log.indexOf('polite:Saved'))
  expect(log).toContain('polite:Ready')
})
