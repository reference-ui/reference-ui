import { test, expect, snap } from '../../../../playwright/ct'
import type { Page } from '@playwright/test'

async function activeTestId(page: Page): Promise<string | null> {
  return page.evaluate(
    () =>
      (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null
  )
}

async function activeWithin(page: Page, testId: string): Promise<boolean> {
  return page.evaluate(id => {
    const scope = document.querySelector(`[data-testid="${id}"]`)
    return !!scope?.contains(document.activeElement)
  }, testId)
}

test.describe('Menubar coordination', () => {
  test('MB-DOM-01: renders a menubar row of menuitem triggers with one tab stop', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const bar = page.getByTestId('menubar-root')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const view = page.getByTestId('trigger-view')

    await expect(bar).toHaveAttribute('role', 'menubar')
    for (const trigger of [file, edit, view]) {
      await expect(trigger).toHaveAttribute('role', 'menuitem')
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toHaveAttribute('data-state', 'closed')
    }
    await expect(file).toHaveAttribute('tabindex', '0')
    await expect(edit).toHaveAttribute('tabindex', '-1')
    await expect(view).toHaveAttribute('tabindex', '-1')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('MB-DOM-02: exposes controlled expansion on exactly the open menu', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(file).toHaveAttribute('aria-expanded', 'true')
    await expect(file).toHaveAttribute('data-state', 'open')
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).toHaveAttribute('data-state', 'closed')
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)

    const controls = await file.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    const controlledRole = await page.evaluate(id => {
      const node = document.getElementById(id!)
      return node?.querySelector('[role="menu"]')?.getAttribute('role') ?? null
    }, controls)
    expect(controlledRole).toBe('menu')
  })

  test('MB-DOM-03: preserves native contracts through interaction', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Basic')
    const bar = page.getByTestId('menubar-root')
    const file = page.getByTestId('trigger-file')

    expect(await bar.evaluate(el => el.tagName)).toBe('DIV')
    expect(await file.evaluate(el => el.tagName)).toBe('BUTTON')

    await file.click()
    const content = page.getByTestId('content-file')
    await expect(content).toBeVisible()
    expect(await content.evaluate(el => el.tagName)).toBe('DIV')

    await page.getByTestId('file-new').click()
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('menubar-action-display')).toHaveText('Last Action: File>New')
  })

  test('MB-OPEN-01: keeps at most one menu open across trigger clicks', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const view = page.getByTestId('trigger-view')

    await page.waitForTimeout(300)
    await snap(page, 'resting')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(1)
    await page.waitForTimeout(300)
    await snap(page, 'file-open')

    await edit.click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).toHaveAttribute('aria-expanded', 'true')
    await page.waitForTimeout(300)
    await snap(page, 'edit-open-switched')

    await view.click()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(page.getByTestId('content-view')).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(1)
  })

  test('MB-OPEN-02: toggles the open menu closed on trigger re-click', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await file.click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
    await expect(file).toBeFocused()
  })

  test('MB-OPEN-03: stays visibly controlled when value updates are rejected', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Controlled')
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('menubar-value-display')).toHaveText('Value: file')

    // Toggle via keyboard: a pointer click is an outside press and would
    // dismiss File before the probe.
    const toggle = page.getByTestId('btn-toggle-reject')
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menubar-reject-display')).toHaveText('Reject: On')
    await expect(page.getByTestId('content-file')).toBeVisible()

    // Pointer down outside File requests close (null), the Edit trigger
    // requests open (edit); the parent rejects both, so File stays open.
    await page.getByTestId('trigger-edit').click()
    await expect(page.getByTestId('menubar-value-logs')).toHaveText(
      'Logs: request:null,request:edit'
    )
    await expect(page.getByTestId('menubar-value-display')).toHaveText('Value: file')
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)

    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menubar-reject-display')).toHaveText('Reject: Off')
    await page.getByTestId('trigger-edit').click()
    await expect(page.getByTestId('menubar-value-display')).toHaveText('Value: edit')
    await expect(page.getByTestId('content-edit')).toBeVisible()
  })

  test('MB-OPEN-05: closes the open menu on outside press', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await page.getByTestId('menubar-outside').click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
  })

  test('MB-OPEN-06: closes the whole bar and restores the trigger after selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await page.getByTestId('file-open').click()
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('menubar-action-display')).toHaveText('Last Action: File>Open')
    await expect(file).toBeFocused()
  })

  test('MB-KEY-01: opens on Down/Enter/Space (first item) and Up (last item)', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    for (const key of ['Enter', ' ', 'ArrowDown'] as const) {
      await file.focus()
      await page.keyboard.press(key)
      await expect(page.getByTestId('file-new')).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('content-file')).toHaveCount(0)
    }

    await file.focus()
    await page.keyboard.press('ArrowUp')
    // Delete is disabled, so the last enabled item is Open.
    await expect(page.getByTestId('file-open')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
  })

  test('MB-KEY-02: moves trigger focus only when no menu is open', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const view = page.getByTestId('trigger-view')

    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(edit).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(view).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(edit).toBeFocused()

    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(file).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(view).toHaveAttribute('aria-expanded', 'false')
  })

  test('MB-KEY-03: moves trigger focus and switches the open menu when a menu is open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()

    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    expect(await activeWithin(page, 'content-edit')).toBe(true)

    // The open menu is Edit's: Escape restores the Edit trigger.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(edit).toBeFocused()
  })

  test('MB-KEY-04: Home/End move trigger focus without switching menus', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const view = page.getByTestId('trigger-view')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()

    await file.focus()
    await page.keyboard.press('End')
    await expect(view).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-view')).toHaveCount(0)

    await page.keyboard.press('Home')
    await expect(file).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
  })

  test('MB-KEY-05: clamps trigger arrows at the edges unless loop is set', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const view = page.getByTestId('trigger-view')

    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(file).toBeFocused()
    await view.focus()
    await page.keyboard.press('ArrowRight')
    await expect(view).toBeFocused()
    await expect(page.getByRole('menu')).toHaveCount(0)

    // Open bars clamp the switch too: no wrap, no value change.
    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(file).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-view')).toHaveCount(0)
  })

  test('MB-KEY-05: loop wraps trigger focus and switching', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Loop')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await edit.focus()
    await page.keyboard.press('ArrowRight')
    await expect(file).toBeFocused()

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
  })

  test('MB-KEY-06: switches menus on Left/Right from a root-level item', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')

    await page.getByTestId('trigger-file').click()
    await page.getByTestId('file-new').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    expect(await activeWithin(page, 'content-edit')).toBe(true)

    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(page.getByTestId('content-file')).toBeVisible()
    expect(await activeWithin(page, 'content-file')).toBe(true)
  })

  test('MB-KEY-07: opens a submenu parent on the open-direction arrow instead of switching', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Submenu')

    await page.getByTestId('trigger-file').click()
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.getByTestId('file-share-content')).toBeVisible()
    await expect(page.getByTestId('menubar-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
  })

  test('MB-KEY-08: never switches menus from inside a nested submenu', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Submenu')

    await page.getByTestId('trigger-file').click()
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()

    // Left closes one submenu level (Menu-owned); the bar does not switch.
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('file-share-content')).toHaveCount(0)
    await expect(page.getByTestId('file-share')).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)

    // Right on a nested item without a submenu is a no-op for the bar too.
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
  })

  test('MB-KEY-09: skips disabled menus in focus and switching', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Disabled')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')
    const help = page.getByTestId('trigger-help')

    await expect(help).toBeDisabled()
    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(edit).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(file).toBeFocused()

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await page.getByTestId('file-new').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    await expect(page.getByTestId('content-help')).toHaveCount(0)

    await help.click({ force: true })
    await expect(page.getByTestId('content-help')).toHaveCount(0)
  })

  test('MB-ESC-01: closes the root menu and restores its trigger on Escape', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await page.getByTestId('file-open').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toBeFocused()
  })

  test('MB-ESC-02: closes one submenu level per Escape with trigger restore', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Submenu')
    const file = page.getByTestId('trigger-file')

    await file.click()
    await page.getByTestId('file-share').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('file-share-email')).toBeFocused()
    await page.waitForTimeout(300)
    await snap(page, 'submenu-open')

    // First Escape: only Share closes; File stays open; focus to Share trigger.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('file-share-content')).toHaveCount(0)
    await expect(page.getByTestId('file-share')).toBeFocused()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await expect(page.getByTestId('menubar-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,share:onDismiss'
    )

    // Second Escape: File closes; focus to the File menubar trigger.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(file).toBeFocused()
  })

  test('MB-FOCUS-01: switches land focus inside the newly opened menu', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')

    // Trigger-arrow switch.
    await file.click()
    await file.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('content-edit')).toBeVisible()
    expect(await activeWithin(page, 'content-edit')).toBe(true)
    expect(await activeTestId(page)).not.toBe('trigger-file')

    // Content-arrow switch back.
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-file')).toBeVisible()
    expect(await activeWithin(page, 'content-file')).toBe(true)
  })

  test('MB-RTL-01: mirrors Left/Right under RTL', async ({ mount, page }) => {
    await mount('components/Menubar/Menubar/Rtl')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await file.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(edit).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(file).toBeFocused()

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    await page.getByTestId('file-new').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('content-file')).toHaveCount(0)
    await expect(page.getByTestId('content-edit')).toBeVisible()
    expect(await activeWithin(page, 'content-edit')).toBe(true)
  })

  test('MB-A11Y-01: keeps expansion and control relationships correct in every state', async ({
    mount,
    page,
  }) => {
    await mount('components/Menubar/Menubar/Basic')
    const file = page.getByTestId('trigger-file')
    const edit = page.getByTestId('trigger-edit')

    await expect(page.getByTestId('menubar-root')).toHaveAttribute('role', 'menubar')

    await file.click()
    await expect(page.getByTestId('content-file')).toBeVisible()
    let controls = await file.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)

    await edit.click()
    await expect(page.getByTestId('content-edit')).toBeVisible()
    await expect(file).not.toHaveAttribute('aria-controls', /.+/)
    controls = await edit.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    const resolvesToMenu = await page.evaluate(id => {
      const node = document.getElementById(id!)
      return node?.querySelector(':scope [role="menu"]') !== null
    }, controls)
    expect(resolvesToMenu).toBe(true)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-edit')).toHaveCount(0)
    await expect(edit).toHaveAttribute('aria-expanded', 'false')
    await expect(edit).not.toHaveAttribute('aria-controls', /.+/)
  })
})
