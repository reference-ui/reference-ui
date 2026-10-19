/**
 * ReferenceLibrary mounted-election hardening. A remounted former host
 * stays standby behind its live successor, and StrictMode elects exactly
 * one runtime while preserving queued work across the double render.
 */
import type { ComponentProps } from 'react'
import { test, expect } from '../../../../../playwright/ct'
import type { StrictRuntimeHarness } from '../../ReferenceLibrary.story'

type StrictProps = ComponentProps<typeof StrictRuntimeHarness>

test.describe('ReferenceLibrary mounted election contracts', () => {
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
});
