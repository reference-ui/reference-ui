import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
  test('CO-DOM-01, CO-DOM-02 & CO-DOM-04: Toggles Collapsible open/closed and updates ARIA attributes', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Basic')
    const trigger = page.getByTestId('btn-collapsible-trigger')
    const content = page.getByTestId('collapsible-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    const root = page.getByTestId('collapsible-fixture-root')

    await page.waitForTimeout(300)
    await snap(page, 'resting-closed')
    await snap(root, 'collapsible-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(trigger, 'collapsible-trigger-resting', { maxDiffPixelRatio: 0.001 })

    // Hover trigger
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-trigger')

    // Click to open
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content.getByTestId('collapsible-text')).toHaveText('Detailed collapsible content.')

    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await page.waitForTimeout(300)
    await snap(page, 'opened')
    await snap(root, 'collapsible-root-opened', { maxDiffPixelRatio: 0.001 })
    await snap(content, 'collapsible-content-opened', { maxDiffPixelRatio: 0.001 })

    // Click to close
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'closed')
    await snap(root, 'collapsible-root-closed', { maxDiffPixelRatio: 0.001 })
  })

  test('CO-SIZE-01: Open Content publishes border-box measurement CSS variables', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Basic')
    const trigger = page.getByTestId('btn-collapsible-trigger')
    await trigger.click()

    const content = page.getByTestId('collapsible-content')
    await expect(content).toBeVisible()

    await expect.poll(async () => {
      return content.evaluate(el =>
        getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim()
      )
    }).toMatch(/^[1-9]/)

    const measurements = await content.evaluate(el => {
      const styles = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        heightVar: styles.getPropertyValue('--reference-collapsible-content-height').trim(),
        widthVar: styles.getPropertyValue('--reference-collapsible-content-width').trim(),
        height: rect.height,
        width: rect.width,
      }
    })

    expect(measurements.heightVar).toMatch(/^\d+(\.\d+)?px$/)
    expect(measurements.widthVar).toMatch(/^\d+(\.\d+)?px$/)
    expect(Math.abs(parseFloat(measurements.heightVar) - measurements.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(parseFloat(measurements.widthVar) - measurements.width)).toBeLessThanOrEqual(1)
  })

  test('CO-DEFAULT-OPEN: Starts expanded with defaultOpen and can be collapsed', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/DefaultOpen')
    const defaultOpenRoot = page.getByTestId('collapsible-default-open-root')
    const trigger = page.getByTestId('btn-default-open-trigger')
    const content = page.getByTestId('default-open-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'default-open-resting')
    await snap(defaultOpenRoot, 'collapsible-default-open-root', { maxDiffPixelRatio: 0.001 })

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'default-open-collapsed')
    await snap(defaultOpenRoot, 'collapsible-default-open-collapsed', { maxDiffPixelRatio: 0.001 })
  })
})

test.describe('Collapsible Quarantine Ports (GSAP-owned motion)', () => {
  test('CO-DOM-01: Collapsible should add no wrapper around its fixed trigger and content elements', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/NoWrapper')
    const container = page.getByTestId('nowrap-container')
    const trigger = page.getByTestId('nowrap-trigger')
    const content = page.getByTestId('nowrap-content')

    await expect(trigger).toBeVisible()
    await expect(content).toBeVisible()
    expect(await trigger.evaluate(el => el.tagName.toLowerCase())).toBe('button')
    expect(await content.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    const childTags = await container.evaluate(el =>
      Array.from(el.children).map(c => c.getAttribute('data-testid'))
    )
    expect(childTags).toEqual(['nowrap-before', 'nowrap-trigger', 'nowrap-content', 'nowrap-after'])
  })

  test('CO-DOM-03: Collapsible should keep its relationship valid throughout a closed exit and remove it after unmount', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await page.getByTestId('probe-close').click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await expect(content).toHaveCount(0, { timeout: 2000 })
    await expect(trigger).not.toHaveAttribute('aria-controls')
  })

  test('CO-DOM-04: Collapsible should expose authoritative open, closed, and disabled state on its rendered parts', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ForgedState')
    const trigger = page.getByTestId('forged-trigger')
    const content = page.getByTestId('forged-content')

    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(trigger).not.toHaveAttribute('data-disabled')
    await expect(content).not.toHaveAttribute('data-disabled')
    await expect(trigger).toHaveAttribute('data-unrelated', 'keep-me-trigger')
    await expect(content).toHaveAttribute('data-unrelated', 'keep-me-content')

    await page.getByTestId('forged-close').click()
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')

    await page.getByTestId('forged-open').click()
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toHaveAttribute('data-state', 'open')

    await page.getByTestId('forged-disable').click()
    await expect(trigger).toBeDisabled()
    await expect(trigger).toHaveAttribute('data-disabled', '')
  })

  test('CO-ACT-01: Collapsible should request opening once when an enabled closed trigger is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledClosed')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    const log = page.getByTestId('probe-log')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await trigger.click()
    await expect(log).toHaveText('[true]')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)
  })

  test('CO-ACT-02: Collapsible should request closing once when an enabled open trigger is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    const log = page.getByTestId('probe-log')

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()

    await trigger.click()
    await expect(log).toHaveText('[false]')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()
  })

  test('CO-ACT-03: Collapsible should use native button keyboard activation without duplicate toggle requests', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledClosed')
    const trigger = page.getByTestId('probe-trigger')
    const log = page.getByTestId('probe-log')
    const reset = page.getByTestId('probe-reset')

    await trigger.focus()

    await page.keyboard.down('Space')
    await page.keyboard.down('Space')
    await expect(log).toHaveText('[]')
    await page.keyboard.up('Space')
    await expect(log).toHaveText('[true]')

    await reset.click()
    await expect(log).toHaveText('[]')
    await trigger.focus()

    await page.keyboard.press('Enter')
    await expect(log).toHaveText('[true]')
  })

  test('CO-PRES-01: Collapsible should keep transitioning Content mounted until its own exit completes', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')

    await expect(content).toBeVisible()
    await page.getByTestId('probe-close').click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveAttribute('data-state', 'closed')

    const heightVar = await content.evaluate(el =>
      getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim()
    )
    expect(heightVar).toMatch(/^[1-9]\d*(\.\d+)?px$/)

    await expect(content).toHaveCount(0, { timeout: 2000 })
  })

  test('CO-PRES-02: Collapsible should ignore descendant end events during exit and unmount on its own completion (re-targeted: CT harness disables CSS keyframes, GSAP holds the exit)', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ExitChild')
    const content = page.getByTestId('exit-content')
    const child = page.getByTestId('exit-child')

    await expect(content).toBeVisible()
    await page.getByTestId('exit-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')

    await child.evaluate(el => el.dispatchEvent(new Event('animationend', { bubbles: true })))
    await child.evaluate(el => el.dispatchEvent(new Event('transitionend', { bubbles: true })))
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'closed')

    await expect(content).toHaveCount(0, { timeout: 2000 })
  })

  test('CO-PRES-03: Collapsible should remove closed Content immediately when no finite exit motion exists (re-targeted: reduced-motion stub zeroes the GSAP exit)', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    await expect(content).toBeVisible()

    await page.evaluate(() => {
      const orig = window.matchMedia.bind(window)
      window.matchMedia = ((query: string) => {
        if (query.includes('prefers-reduced-motion')) {
          return {
            matches: true,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
          }
        }
        return orig(query)
      }) as unknown as typeof window.matchMedia
    })

    await page.getByTestId('probe-close').click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // A normal GSAP exit holds content ~320ms; reduced motion must beat 250ms.
    await expect(content).toHaveCount(0, { timeout: 250 })
  })

  test('CO-PRES-04: Collapsible should cancel an in-flight exit when controlled state reopens', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const content = page.getByTestId('probe-content')

    await expect(content).toBeVisible()
    await page.getByTestId('probe-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')

    await page.getByTestId('probe-set-open').click()
    await expect(content).toHaveAttribute('data-state', 'open')

    // The stale exit's end event cannot remove the reopened node.
    await content.evaluate(el => el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true })))
    await page.waitForTimeout(400)
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')

    const heightVar = await content.evaluate(el =>
      getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim()
    )
    expect(heightVar).toMatch(/^[1-9]/)
  })

  test('CO-PRES-05: Collapsible should give each exit a fresh lifecycle without replaying mount-only motion (re-targeted: GSAP skipEnter probe + close/reopen/close lifecycle)', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/DefaultOpen')
    const defaultContent = page.getByTestId('default-open-content')
    await expect(defaultContent).toBeVisible()
    // Initially-open content renders at final size with no enter tween inline state.
    expect(await defaultContent.evaluate(el => (el as HTMLElement).style.height)).toBe('auto')

    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const content = page.getByTestId('probe-content')
    await expect(content).toBeVisible()

    await page.getByTestId('probe-close').click()
    await expect(content).toHaveCount(0, { timeout: 2000 })

    await page.getByTestId('probe-set-open').click()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')

    await page.getByTestId('probe-close').click()
    await expect(content).toHaveCount(0, { timeout: 2000 })
  })

  test('CO-PRES-07: Collapsible should evacuate focus before closing Content becomes inert', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const input1 = page.getByTestId('probe-input')
    const trigger1 = page.getByTestId('probe-trigger')

    await input1.focus()
    await expect(input1).toBeFocused()
    await page.getByTestId('probe-close').click()
    await expect(trigger1).toBeFocused()

    await mount('components/Collapsible/Collapsible/FocusFallback')
    const input2 = page.getByTestId('fb-input')

    await input2.focus()
    await expect(input2).toBeFocused()
    await page.getByTestId('fb-close').click()

    const isInside = await input2.evaluate(el => document.activeElement === el)
    expect(isInside).toBe(false)
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
  })

  test('CO-PRES-08: Collapsible should isolate visually exiting closed Content and restore only isolation it owns', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Isolation')
    const content = page.getByTestId('iso-content')
    const childBtn = page.getByTestId('iso-btn')
    const clicks = page.getByTestId('iso-clicks')

    await expect(content).toBeVisible()
    await page.getByTestId('iso-close').click()

    // Toggled imperatively so all React runtimes isolate (17/18 skip JSX inert).
    await expect(content).toHaveAttribute('inert', '')
    await expect(content).toHaveAttribute('aria-hidden', 'true')

    await childBtn.click({ force: true })
    await expect(clicks).toHaveText('0')

    await page.getByTestId('iso-reopen').click()
    await expect(content).not.toHaveAttribute('inert')
    await expect(content).not.toHaveAttribute('aria-hidden')

    await childBtn.click()
    await expect(clicks).toHaveText('1')
  })

  test('CO-SIZE-01 (exact): Collapsible should publish exact border-box measurements under GSAP-owned box-sizing', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/SizeExact')
    const content = page.getByTestId('size-content')
    await expect(content).toBeVisible()

    await expect.poll(async () => {
      return content.evaluate(el =>
        getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim()
      )
    }).toMatch(/^[1-9]/)

    const measurements = await content.evaluate(el => {
      const styles = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        heightVar: styles.getPropertyValue('--reference-collapsible-content-height').trim(),
        widthVar: styles.getPropertyValue('--reference-collapsible-content-width').trim(),
        height: rect.height,
        width: rect.width,
        boxSizing: styles.boxSizing,
      }
    })

    // The collapse engine forces border-box: authored 120px + padding + border
    // measure a 120px border box (quarantine content-box math does not apply).
    expect(measurements.boxSizing).toBe('border-box')
    expect(parseFloat(measurements.widthVar)).toBeCloseTo(120, 0)
    expect(Math.abs(parseFloat(measurements.widthVar) - measurements.width)).toBeLessThanOrEqual(1)
    expect(measurements.heightVar).toMatch(/^\d+(\.\d+)?px$/)
    expect(Math.abs(parseFloat(measurements.heightVar) - measurements.height)).toBeLessThanOrEqual(1)
  })

  test('CO-SIZE-02: Collapsible should snapshot the last open size before closed CSS can collapse the box', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/SizeSnapshot')
    const snapContent = page.getByTestId('snap-content')

    await expect(snapContent).toBeVisible()
    await page.getByTestId('snap-close').click()

    const vars = await snapContent.evaluate(el => {
      const styles = getComputedStyle(el)
      return {
        w: styles.getPropertyValue('--reference-collapsible-content-width').trim(),
        h: styles.getPropertyValue('--reference-collapsible-content-height').trim(),
      }
    })

    expect(parseFloat(vars.w)).toBeCloseTo(160, 0)
    expect(parseFloat(vars.h)).toBeCloseTo(64, 0)
  })

  test('CO-SIZE-03: Collapsible should refresh open measurements without taking ownership of application layout or motion styles', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Resizable')
    const content = page.getByTestId('resize-content')

    await expect(content).toBeVisible()

    let vars = await content.evaluate(el => ({
      w: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim(),
      h: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim(),
      density: getComputedStyle(el).getPropertyValue('--product-density').trim(),
    }))
    // ResizeObserver publishes asynchronously; poll until the initial size lands.
    if (!/^[1-9]/.test(vars.w)) {
      await expect.poll(async () => {
        return content.evaluate(el =>
          getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim()
        )
      }).toMatch(/^[1-9]/)
      vars = await content.evaluate(el => ({
        w: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim(),
        h: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim(),
        density: getComputedStyle(el).getPropertyValue('--product-density').trim(),
      }))
    }
    expect(parseFloat(vars.w)).toBeCloseTo(100, 0)
    expect(parseFloat(vars.h)).toBeCloseTo(40, 0)
    expect(vars.density).toBe('compact')

    await page.getByTestId('resize-btn').click()
    await expect.poll(async () => {
      return content.evaluate(el =>
        parseFloat(getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width'))
      )
    }).toBeCloseTo(180, 0)

    vars = await content.evaluate(el => ({
      w: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim(),
      h: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim(),
      density: getComputedStyle(el).getPropertyValue('--product-density').trim(),
    }))
    expect(parseFloat(vars.h)).toBeCloseTo(70, 0)
    expect(vars.density).toBe('compact')
  })

  test('CO-COMP-01: A plain Collapsible should provide a complete controlled disclosure without requiring motion CSS', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/FollowClosed')
    const trigger = page.getByTestId('follow-trigger')
    const content = page.getByTestId('follow-content')
    const adjacentInput = page.getByTestId('follow-adjacent-input')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()

    await trigger.focus()
    await page.keyboard.press('Space')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(adjacentInput).toBeFocused()
  })

  test('CO-COMP-02: An animated Collapsible should survive a close that is interrupted by reopening', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    const input = page.getByTestId('probe-input')

    await expect(content).toBeVisible()
    await input.focus()
    await expect(input).toBeFocused()

    await page.getByTestId('probe-close').click()
    await expect(trigger).toBeFocused()
    await expect(content).toHaveAttribute('inert', '')

    await page.getByTestId('probe-set-open').click()
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content).not.toHaveAttribute('inert')

    // Valid pixel measurements after the interrupt (poll: a remount republishes async).
    await expect.poll(async () => {
      return content.evaluate(el =>
        parseFloat(getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height'))
      )
    }).toBeGreaterThan(0)

    await page.getByTestId('probe-close').click()
    await expect(content).toHaveCount(0, { timeout: 2000 })
  })

  test('CO-COMP-03: Collapsible should remain the disclosure runtime when composed as a nested Accordion item', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/AccordionNest')
    const accTrigger1 = page.getByTestId('nest-acc-trigger-1')
    const accTrigger2 = page.getByTestId('nest-acc-trigger-2')
    const accContent1 = page.getByTestId('nest-acc-content-1')
    const innerTrigger = page.getByTestId('nest-inner-trigger')
    const innerContent = page.getByTestId('nest-inner-content')
    const innerLog = page.getByTestId('nest-inner-log')

    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(accContent1).toBeVisible()

    await expect(innerTrigger).toHaveAttribute('aria-expanded', 'false')
    await expect(innerContent).toHaveCount(0)

    await innerTrigger.click()
    await expect(innerLog).toHaveText('[true]')
    await expect(innerTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(innerContent).toBeVisible()
    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'true')

    await accTrigger2.click()
    await expect(accTrigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('nest-acc-content-2')).toBeVisible()
    await expect(accContent1).toHaveCount(0, { timeout: 2000 })
  })

  test('CO-MOUNT-CT-01: closed hidden-until-found content stays in the DOM, rendering-skipped, and linked', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/UntilFound')
    const trigger = page.getByTestId('uf-trigger')
    const content = page.getByTestId('uf-content')

    await expect(content).toBeVisible()
    await page.getByTestId('uf-close').click()
    await expect(content).toHaveCount(1)
    await expect(content).toBeHidden()
    await expect(content).toHaveAttribute('hidden', 'until-found')
    await expect(content).toHaveAttribute('data-state', 'closed')
    // hidden=until-found skips rendering via content-visibility (display
    // stays; boxes go zero) so find-in-page can still match the text.
    const skipped = await content.evaluate((el) => getComputedStyle(el).contentVisibility)
    expect(skipped).toBe('hidden')
    const contentId = await content.getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await trigger.click()
    await expect(content).toBeVisible()
    await expect(content).not.toHaveAttribute('hidden', 'until-found')
  })

  test('CO-MOUNT-CT-02: native beforematch opens hidden-until-found content; a cancelled reveal stays closed', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/UntilFound')
    const content = page.getByTestId('uf-content')

    await page.getByTestId('uf-close').click()
    await expect(content).toBeHidden()

    await content.evaluate((el) => {
      el.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')

    await page.getByTestId('uf-close').click()
    await expect(content).toBeHidden()
    await content.evaluate((el) => {
      el.addEventListener(
        'beforematch',
        (event) => event.preventDefault(),
        { once: true }
      )
      el.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    await expect(content).toBeHidden()
    await expect(content).toHaveAttribute('data-state', 'closed')
  })

  test('CO-MOUNT-CT-03: forceMount closed content stays visible and keeps focus inside it', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ForceMount')
    const trigger = page.getByTestId('fm-trigger')
    const content = page.getByTestId('fm-content')
    const input = page.getByTestId('fm-input')

    await input.focus()
    await expect(input).toBeFocused()
    await page.getByTestId('fm-close').click()

    await expect(content).toHaveCount(1)
    await expect(content).toBeVisible()
    await expect(content).not.toHaveAttribute('hidden', 'until-found')
    await expect(content).toHaveAttribute('data-state', 'closed')
    expect(await content.evaluate((el) => el.hasAttribute('inert'))).toBe(false)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toBeFocused()
  })
})
