import type { ComponentProps } from 'react'
import { test, expect } from '../../../../playwright/ct'
import type { StrictRuntimeHarness } from '../ReferenceLibrary.story'

type StrictProps = ComponentProps<typeof StrictRuntimeHarness>

test.describe('ReferenceLibrary mounted election contracts', () => {
  test('RL-ROOT-04: a remounted former host stays standby behind its live successor', async ({ mount, page }) => {
    await mount('components/ReferenceLibrary/ReferenceLibrary/ReferenceLibraryFixture')
    const hosts = page.locator('[data-reference-toast-host]')
    const primary = page.getByTestId('root-primary')
    const standby = page.getByTestId('root-standby')
    const toast = page.locator('[data-toast-id="toast-save"]')

    await expect(primary.locator('[data-reference-toast-host]')).toHaveCount(1)
    await page.getByTestId('btn-show-toast').click()
    await expect(toast).toHaveCount(1)
    await expect(toast).toBeVisible()
    await page.getByTestId('btn-toggle-primary').click()
    await expect(standby.locator('[data-reference-toast-host]')).toHaveCount(1)
    await expect(standby.locator('[data-toast-id="toast-save"]')).toBeVisible()

    await page.getByTestId('btn-toggle-primary').click()
    await expect(page.getByTestId('app-primary')).toBeVisible()
    await expect(primary.locator('[data-reference-toast-host]')).toHaveCount(0)
    await expect(standby.locator('[data-reference-toast-host]')).toHaveCount(1)
    await page.getByTestId('btn-show-toast').click()
    await page.getByTestId('btn-announce').click()
    await expect(hosts).toHaveCount(1)
    await expect(toast).toHaveCount(1)
    await expect(standby.locator('[data-reference-announcer="polite"]')).toHaveText('File uploaded completely')
    await expect(page.locator('[data-reference-announcer="polite"]')).toHaveCount(1)
    await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveCount(1)

    await page.getByTestId('btn-toggle-standby').click()
    await expect(primary.locator('[data-reference-toast-host]')).toHaveCount(1)
    await expect(hosts).toHaveCount(1)
    await expect(primary.locator('[data-toast-id="toast-save"]')).toBeVisible()
    await expect(toast).toHaveCount(1)
    await expect(page.locator('[data-reference-announcer="polite"]')).toHaveCount(1)
    await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveCount(1)
  })

  test('RL-LIFE-06: StrictMode elects one runtime and preserves queued work through rerender', async ({ mount, page }) => {
    const props: StrictProps = { revision: 'initial', closeButton: false }
    const fixture = await mount('components/ReferenceLibrary/ReferenceLibrary/StrictRuntimeHarness', props)
    const host = page.locator('[data-reference-toast-host]')
    const polite = page.locator('[data-reference-announcer="polite"]')
    const assertive = page.locator('[data-reference-announcer="assertive"]')
    const toast = page.locator('[data-toast-id="library-strict-toast"]')

    await page.getByTestId('library-strict-queue').click()
    await expect(host).toHaveCount(0)
    await expect(toast).toHaveCount(0)
    await expect(polite).toHaveCount(0)
    await page.getByTestId('library-strict-toggle').click()
    await expect(host).toHaveCount(1)
    await expect(toast).toHaveCount(1)
    await expect(toast).toHaveText('Queued strict toast')
    await expect(toast).toBeVisible()
    await expect(polite).toHaveCount(1)
    await expect(polite).toHaveText('Queued strict announcement')
    await expect(assertive).toHaveCount(1)
    await expect(assertive).toHaveText('')
    const originalHost = await host.elementHandle()
    expect(originalHost).toBeTruthy()

    await fixture.update({ revision: 'latest', closeButton: true } satisfies StrictProps)
    await expect(page.getByTestId('library-strict-app')).toHaveText('Application latest')
    await expect(host).toHaveCount(1)
    await expect.poll(() => host.evaluate((element, original) => element === original, originalHost)).toBe(true)
    await expect(toast).toHaveCount(1)
    await expect(toast).toBeVisible()
    await expect(polite).toHaveCount(1)
    await expect(assertive).toHaveCount(1)

    await page.getByTestId('library-strict-toggle').click()
    await expect(host).toHaveCount(0)
    await expect(toast).toHaveCount(0)
    await expect(polite).toHaveCount(0)
    await expect(assertive).toHaveCount(0)
  })
})
