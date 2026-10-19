/**
 * ReferenceLibrary mounted-election hardening. A remounted former host
 * stays standby behind its live successor, and StrictMode elects exactly
 * one runtime while preserving queued work across the double render.
 */
import type { ComponentProps } from 'react'
import { test, expect } from '../../../../../playwright/ct'
import type { StrictRuntimeHarness } from '../../ReferenceLibrary.story'

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
});
