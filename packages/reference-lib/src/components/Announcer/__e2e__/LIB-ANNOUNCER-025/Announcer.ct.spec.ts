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

test('ANN-DOM-06 / ANN-COMP-02 / TO-ANN-04: silent toast has no live semantics; Saved lives only in the polite region', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-toast-silent').click()
  const item = page.locator('[data-reference-toast-id="silent"]')
  await expect(item).toBeVisible()
  await expect(item).toContainText('Payment failed')
  await expect(item).not.toHaveAttribute('aria-live')
  const role = await item.getAttribute('role')
  expect(['status', 'alert']).not.toContain(role)

  await page.getByTestId('btn-ov-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('')
  expect(await item.evaluate(el => el.textContent ?? '')).not.toContain('Saved')
  expect((await annLog(page)).some(e => e.includes('Payment failed'))).toBe(false)
})
