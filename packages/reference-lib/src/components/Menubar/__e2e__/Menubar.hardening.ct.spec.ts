/**
 * Menubar consumer and lifecycle contracts in the browser. Cancellation
 * ordering, silent programmatic updates, and live registry dynamics
 * must hold without stale emissions or inherited intent.
 */
import { test, expect } from '../../../../playwright/ct'
import type { ComponentProps } from 'react'
import type { ContractHarness } from '../Menubar.story'

type ContractProps = ComponentProps<typeof ContractHarness>

test.describe('Menubar consumer and lifecycle contracts', () => {
  test('MB-EVENT-01: consumer cancellation prevents pointer and native keyboard opening before value requests', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness', {
      cancelTrigger: true,
    })
    const file = page.getByTestId('contract-trigger-file')
    const requests = page.getByTestId('contract-requests')

    await file.click()
    await expect(page.getByTestId('contract-events')).toHaveText('file:click:null')
    await file.focus()
    for (const key of ['Enter', 'Space', 'ArrowDown', 'ArrowUp']) {
      await file.press(key)
      await expect(file).toBeFocused()
      await expect(file).toHaveAttribute('aria-expanded', 'false')
      await expect(page.getByRole('menu')).toHaveCount(0)
      await expect(requests).toHaveText('')
    }

    await fixture.update({ cancelTrigger: false })
    await file.press('ArrowDown')
    await expect(page.getByTestId('contract-file-first')).toBeFocused()
    await expect(requests).toHaveText('initial:file')
    await expect(page.getByTestId('contract-events')).toContainText('file:ArrowDown:null')
  })

  test('MB-EVENT-02: consumer cancellation prevents closed roving and open trigger or content switching', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness', {
      cancelTrigger: true,
    })
    const file = page.getByTestId('contract-trigger-file')
    const requests = page.getByTestId('contract-requests')

    await file.focus()
    for (const key of ['ArrowRight', 'End']) {
      await file.press(key)
      await expect(file).toBeFocused()
      await expect(requests).toHaveText('')
    }

    await fixture.update({ cancelTrigger: false })
    await file.press('ArrowDown')
    await expect(page.getByTestId('contract-file-first')).toBeFocused()
    await fixture.update({ cancelTrigger: true, cancelContent: true })
    await file.focus()
    await file.press('ArrowRight')
    await expect(file).toBeFocused()
    await expect(page.getByTestId('contract-content-file')).toBeVisible()

    const first = page.getByTestId('contract-file-first')
    await first.focus()
    await first.press('ArrowRight')
    await expect(first).toBeFocused()
    await expect(requests).toHaveText('initial:file')
    await expect(page.getByTestId('contract-content-edit')).toHaveCount(0)

    await fixture.update({ cancelTrigger: false, cancelContent: false })
    await first.press('ArrowRight')
    await expect(page.getByTestId('contract-content-edit')).toBeVisible()
    await expect(requests).toHaveText('initial:file,initial:edit')
  })

  test('MB-CTRL-01: programmatic values update mounted relationships silently and do not inherit stale entry intent', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness', {
      heldValue: 'file',
    })
    const file = page.getByTestId('contract-trigger-file')
    const edit = page.getByTestId('contract-trigger-edit')
    const original = await file.elementHandle()
    const requests = page.getByTestId('contract-requests')

    await expect(page.getByTestId('contract-content-file')).toBeVisible()
    const fileControls = await file.getAttribute('aria-controls')
    expect(fileControls).toBeTruthy()
    await file.focus()
    await file.press('ArrowUp')
    await expect(requests).toHaveText('')

    await fixture.update({ heldValue: 'edit' })
    await expect(page.getByTestId('contract-content-file')).toHaveCount(0)
    await expect(page.getByTestId('contract-content-edit')).toBeVisible()
    await expect(file).not.toHaveAttribute('aria-controls', /.+/)
    await expect(edit).toHaveAttribute('aria-expanded', 'true')
    const editControls = await edit.getAttribute('aria-controls')
    expect(editControls).toBeTruthy()
    expect(editControls).not.toBe(fileControls)
    await expect(page.locator(`[id="${editControls}"]`).getByRole('menu')).toHaveCount(1)
    await expect(page.getByTestId('contract-edit-last')).not.toBeFocused()
    await expect.poll(() => page.getByTestId('contract-content-edit').evaluate(element => element.contains(document.activeElement))).toBe(true)
    await expect(requests).toHaveText('')

    await fixture.update({ heldValue: null })
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)
    expect(await file.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(requests).toHaveText('')

    await fixture.update({ heldValue: 'file' })
    await expect(page.getByTestId('contract-content-file')).toBeVisible()
    await expect(file).toHaveAttribute('aria-controls', fileControls!)
    await expect(requests).toHaveText('')
  })

  test('MB-DYNAMIC-01: live menu reorder insertion removal and disabling drive one current navigation registry', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness')
    const file = page.getByTestId('contract-trigger-file')
    const original = await file.elementHandle()
    const requests = page.getByTestId('contract-requests')

    await fixture.update({ menus: ['file', 'view', 'edit'] })
    await file.focus()
    await file.press('ArrowRight')
    await expect(page.getByTestId('contract-trigger-view')).toBeFocused()
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(requests).toHaveText('')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('contract-view-first')).toBeFocused()

    await fixture.update({ menus: ['view', 'help', 'file', 'edit'] })
    await page.getByTestId('contract-view-first').press('ArrowRight')
    await expect(page.getByTestId('contract-content-help')).toBeVisible()
    await expect(requests).toHaveText('initial:view,initial:help')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)

    await fixture.update({ menus: ['view', 'file', 'edit'], disabledMenus: ['file'] })
    await page.getByTestId('contract-trigger-view').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('contract-trigger-edit')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('contract-edit-first')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('contract-content-view')).toBeVisible()
    await expect(page.getByTestId('contract-content-help')).toHaveCount(0)
    await expect(page.getByTestId('contract-content-file')).toHaveCount(0)
    await expect(page.getByTestId('contract-bar').locator('[tabindex="0"]')).toHaveCount(1)
    expect(await file.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(requests).toHaveText('initial:view,initial:help,initial:null,initial:edit,initial:view')
  })

  test('MB-DYNAMIC-02: mounted direction and callback updates apply to the next switch without stale emissions', async ({ mount, page }) => {
    const fixture = await mount<ContractProps>('components/Menubar/Menubar/ContractHarness')
    const file = page.getByTestId('contract-trigger-file')
    const original = await file.elementHandle()
    await file.focus()
    await file.press('ArrowDown')
    await expect(page.getByTestId('contract-file-first')).toBeFocused()

    await fixture.update({ dir: 'rtl', handlerVersion: 'current' })
    await file.focus()
    await file.press('ArrowLeft')
    await expect(page.getByTestId('contract-content-edit')).toBeVisible()
    await expect(page.getByTestId('contract-requests')).toHaveText('initial:file,current:edit')
    await page.getByTestId('contract-edit-first').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('contract-content-file')).toBeVisible()
    await expect(page.getByTestId('contract-requests')).toHaveText('initial:file,current:edit,current:file')
    expect(await file.evaluate((element, node) => element === node, original)).toBe(true)
    await expect(file).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('contract-trigger-edit')).toHaveAttribute('aria-expanded', 'false')
  })
})
