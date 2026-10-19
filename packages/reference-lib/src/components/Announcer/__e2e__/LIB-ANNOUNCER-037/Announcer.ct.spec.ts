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

test('ANN-LIFE-06: cleared text is not re-spoken when a host mounts after the recycle delay', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-mount').click()
  await page.getByTestId('btn-life-old').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Old')
  await page.getByTestId('btn-life-unmount').click()

  await page.waitForTimeout(8000)
  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('')

  const log = await annLog(page)
  const tail = log.slice(log.lastIndexOf('added-polite:'))
  expect(tail[0]).toBe('added-polite:')
  expect(tail.filter(e => e === 'polite:Old')).toEqual([])
})
