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

test('ANN-LIVE-04 / TO-ANN-07: blanks ignored; text survives the safe interval then recycles silently', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-blanks').click()
  await page.waitForTimeout(200)
  const afterBlanks = await annLog(page)
  expect(
    afterBlanks.every(e => e.startsWith('added-') || e === 'polite:' || e === 'assertive:')
  ).toBe(true)

  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForTimeout(3000)
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 15000 }
  )

  // The clear is not a second message: nothing non-empty follows it.
  const mark = (await annLog(page)).length
  await page.waitForTimeout(500)
  expect(
    (await annLog(page)).slice(mark).filter(e => e !== 'polite:' && e !== 'assertive:')
  ).toEqual([])
})
