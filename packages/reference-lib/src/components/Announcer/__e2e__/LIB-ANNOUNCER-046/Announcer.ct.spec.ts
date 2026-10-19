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

test('ANN-HOST-04: an accidental second host never produces a second copy', async ({
  mount,
  page,
}) => {
  await mount(ELECTION)
  await expect(page.getByTestId('root-primary')).toBeVisible()

  await page.getByTestId('btn-el-rogue').click()
  await page.getByTestId('btn-el-announce').click()
  await expect(
    page.locator('[data-reference-announcer="polite"]', { hasText: 'Once' })
  ).toHaveCount(1)

  const texts = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reference-announcer="polite"]')].map(
      el => el.textContent ?? ''
    )
  )
  expect(texts.filter(t => t === 'Once')).toHaveLength(1)
  expect(texts.every(t => t === 'Once' || t === '')).toBe(true)
})
