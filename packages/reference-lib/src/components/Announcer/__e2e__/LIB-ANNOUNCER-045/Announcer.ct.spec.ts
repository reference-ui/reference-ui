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

test('ANN-HOST-03 / RL-ROOT-06: host DOM stays inside the winning ShadowRoot', async ({
  mount,
  page,
}) => {
  await mount('components/Toast/Toast/HardenShadow')
  await expect(page.getByTestId('toast-fixture-root')).toBeVisible()

  await page.getByTestId('btn-shadow-announce').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Shadow ready')

  const shadow = await page.evaluate(() => {
    const shadowHost = document.querySelector('[data-testid="shadow-host"]')
    const inShadow = Boolean(
      shadowHost?.shadowRoot?.querySelector('[data-reference-announcer-host]')
    )
    const lightCount = [...document.querySelectorAll('[data-reference-announcer-host]')].filter(
      n => !shadowHost?.shadowRoot?.contains(n)
    ).length
    return { inShadow, lightCount }
  })
  expect(shadow).toEqual({ inShadow: true, lightCount: 0 })
})
