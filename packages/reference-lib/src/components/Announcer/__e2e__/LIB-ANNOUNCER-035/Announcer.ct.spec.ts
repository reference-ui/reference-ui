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

test('ANN-LIFE-04: hostless work after unmount re-queues and inserts as a mutation (sticky-activation defect)', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-mount').click()
  await page.getByTestId('btn-life-before').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Before')

  await page.getByTestId('btn-life-unmount').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)
  await expect(page.getByTestId('readout-life-mounted')).toHaveText('hostless')

  await page.getByTestId('btn-life-after').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)

  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('After')

  // Sticky `activated` would paint After (or Before) as initial region text.
  const log = await annLog(page)
  const added = log.filter(e => e.startsWith('added-polite:'))
  expect(added[added.length - 1]).toBe('added-polite:')
  expect(log.lastIndexOf('polite:After')).toBeGreaterThan(log.lastIndexOf('added-polite:'))
})
