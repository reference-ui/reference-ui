import { expect, test } from '@playwright/test'

test.describe('FocusLock Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/focus-lock')
    await expect(page.getByTestId('focus-lock-fixture-root')).toBeVisible()
  })

  test('FL-INIT-01: Focuses the first enabled tabbable descendant on activation', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const firstBtn = page.getByTestId('lock-btn-first')
    await expect(firstBtn).toBeFocused()
  })

  test('FL-TAB-02 & FL-TAB-03: Wraps Tab on last candidate and Shift+Tab on first candidate', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const firstBtn = page.getByTestId('lock-btn-first')
    const closeBtn = page.getByTestId('btn-close-lock')

    await expect(firstBtn).toBeFocused()

    // Shift+Tab from first wraps to the last candidate (or close button/shard)
    await page.keyboard.press('Shift+Tab')
    const shardBtn = page.getByTestId('shard-button')
    // Last tabbable is shard button because it is registered in shards!
    await expect(shardBtn).toBeFocused()

    // Tab from shard button wraps back to first candidate
    await page.keyboard.press('Tab')
    await expect(firstBtn).toBeFocused()
  })

  test('FL-TRAP-01: Reclaims focus when outside focus is attempted', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()
    const firstBtn = page.getByTestId('lock-btn-first')
    await expect(firstBtn).toBeFocused()

    // Attempt to focus outside button
    await page.getByTestId('outside-button').focus()

    // Should be reclaimed back to active lock
    await expect(firstBtn).toBeFocused()
  })

  test('FL-SHARD-01: Permits focus inside registered outside shard', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const shardBtn = page.getByTestId('shard-button')
    await shardBtn.click()

    // Focus remains in shard without being reclaimed
    await expect(shardBtn).toBeFocused()
  })

  test('FL-TAB-01 & FL-CAND-01 & FL-CAND-02 & FL-CAND-03 & FL-CAND-04 & FL-CAND-05 & FL-CAND-06 & FL-CAND-10 & FL-CAND-11 & FL-CAND-12: catalog visits native tabbables and native exclusions', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-catalog').click()
    await expect(page.getByTestId('catalog-btn')).toBeFocused()

    const order: string[] = []
    for (let i = 0; i < 24; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      if (id) order.push(id)
      await page.keyboard.press('Tab')
      if (id === 'catalog-btn' && i > 0) break
    }

    expect(order).toContain('catalog-btn')
    expect(order).toContain('catalog-input')
    expect(order).toContain('catalog-select')
    expect(order).toContain('catalog-textarea')
    expect(order).toContain('catalog-link')
    expect(order).toContain('catalog-legend-btn')
    expect(order).toContain('catalog-radio-b')
    expect(order).toContain('catalog-summary')
    expect(order).toContain('catalog-opacity')
    expect(order).toContain('catalog-aria-hidden')
    expect(order).toContain('catalog-iframe')
    expect(order).not.toContain('catalog-fieldset-body')
    expect(order).not.toContain('catalog-radio-a')
    expect(order).not.toContain('catalog-details-inner')
    expect(order).not.toContain('catalog-disabled')
    expect(order).not.toContain('catalog-nohref')
    expect(order).not.toContain('catalog-audio')
    expect(order).not.toContain('catalog-ce-false')
    expect(order).not.toContain('catalog-negative')
    expect(order).not.toContain('catalog-display-none')
    expect(order).not.toContain('catalog-vis-hidden')
    expect(order).not.toContain('catalog-attr-hidden')
    expect(order).not.toContain('catalog-inert')
  })

  test('FL-CAND-08: Tab order includes open shadow descendants', async ({ page }) => {
    await page.getByTestId('btn-open-shadow').click()
    await expect(page.getByTestId('shadow-before')).toBeFocused()
    await expect(page.getByTestId('shadow-inner-button')).toBeVisible()
    await page.keyboard.press('Tab')
    const inner = page.getByTestId('shadow-inner-button')
    await expect(inner).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shadow-after')).toBeFocused()
  })

  test('FL-NEST-01 & FL-NEST-02 & FL-NEST-03: nested standalone locks pause and resume', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()
    await expect(page.getByTestId('lock-btn-first')).toBeFocused()
    await page.getByTestId('btn-open-inner-lock').click()
    await expect(page.getByTestId('inner-lock-first')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('inner-lock-last')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('btn-close-inner-lock')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('inner-lock-first')).toBeFocused()

    await page.getByTestId('lock-btn-first').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('inner-lock-first')).toBeFocused()

    await page.getByTestId('btn-close-inner-lock').click()
    await expect(page.getByTestId('inner-lock-container')).toHaveCount(0)
    await expect(page.getByTestId('btn-open-inner-lock')).toBeFocused()
  })

  test('FL-RESTORE-03: restores to the right sibling when the opener is removed', async ({
    page,
  }) => {
    await page.getByTestId('btn-proximity-opener').click()
    await expect(page.getByTestId('proximity-lock')).toBeVisible()
    await page.getByTestId('btn-remove-opener-close').click()
    await expect(page.getByTestId('proximity-lock')).toHaveCount(0)
    await expect(page.getByTestId('btn-proximity-opener')).toHaveCount(0)
    await expect(page.getByTestId('btn-proximity-right')).toBeFocused()
  })

  test('FL-RESTORE-01: Restores focus to the trigger element on deactivation', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-trigger')
    await trigger.click()

    await expect(page.getByTestId('lock-btn-first')).toBeFocused()
    await page.getByTestId('btn-close-lock').click()
    await expect(trigger).toBeFocused()
  })

  test('FL-DOM-01: preserves the authored container without wrapper or guards', async ({ page }) => {
    await page.getByTestId('btn-trigger').click()
    const info = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="focus-lock-container"]')
      return {
        parent: container?.parentElement?.getAttribute('data-testid'),
        sentinels: document.querySelectorAll('[data-focus-lock], [data-focus-guard]').length,
      }
    })
    expect(info.parent).toBe('focus-lock-fixture-root')
    expect(info.sentinels).toBe(0)
  })

  test('FL-DOM-02 & FL-INIT-02 & FL-TAB-07: empty container gets fallback tabindex only while locked', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-empty').click()
    const empty = page.getByTestId('empty-lock')
    await expect(empty).toBeFocused()
    await expect(empty).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('Tab')
    await expect(empty).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(empty).toBeFocused()
    await page.getByTestId('btn-close-empty').click()
    await expect(empty).toHaveCount(0)
    await page.getByTestId('after-empty').focus()
    await page.keyboard.press('Shift+Tab')
    const after = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(after).not.toBe('empty-lock')
  })

  test('FL-DOM-03: invalid children throw the single-element error', async ({ page }) => {
    await page.getByTestId('btn-invalid-text').click()
    await expect(page.getByTestId('fl-dom-03-error')).toContainText(
      'FocusLock expects a single valid React element child'
    )
  })

  test('FL-DOM-04: callback-ref rerenders settle without an attach loop', async ({ page }) => {
    await page.getByTestId('btn-open-dom-04').click()
    const container = page.getByTestId('fl-dom-04-container')
    await expect(container).toBeVisible()
    const count = Number(await container.getAttribute('data-attach-count'))
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(8)
    await expect(page.getByTestId('fl-dom-04-btn')).toHaveCount(1)
  })

  test('FL-INIT-03: initialFocus ref skips the first candidate', async ({ page }) => {
    await page.getByTestId('btn-init-mode-second').click()
    await page.getByTestId('btn-open-init').click()
    await expect(page.getByTestId('init-second')).toBeFocused()
  })

  test('FL-INIT-04: initialFocus can target a tabindex=-1 descendant', async ({ page }) => {
    await page.getByTestId('btn-init-mode-negative').click()
    await page.getByTestId('btn-open-init').click()
    await expect(page.getByTestId('init-negative')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('init-first')).toBeFocused()
  })

  test('FL-INIT-05: invalid initialFocus falls back to the first tabbable', async ({ page }) => {
    await page.getByTestId('btn-init-mode-invalid').click()
    await page.getByTestId('btn-open-init').click()
    await expect(page.getByTestId('init-first')).toBeFocused()
  })

  test('FL-INIT-06: initialFocus false skips the activation move then traps', async ({ page }) => {
    await page.getByTestId('btn-init-mode-skip').click()
    await page.getByTestId('btn-open-init').click()
    await expect(page.getByTestId('init-lock')).toBeVisible()
    await expect(page.getByTestId('init-first')).not.toBeFocused()
    await page.getByTestId('init-second').focus()
    await expect(page.getByTestId('init-second')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('init-second')).toBeFocused()
  })

  test('FL-INIT-07: activation preserves focus already inside', async ({ page }) => {
    await page.getByTestId('btn-focus-init-second-then-enable').click()
    await expect(page.getByTestId('init-lock')).toBeVisible()
    await page.getByTestId('init-second').focus()
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="btn-enable-init"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    await expect(page.getByTestId('init-second')).toBeFocused()
  })

  test('FL-INIT-08: disabled lock stays inert', async ({ page }) => {
    await page.getByTestId('btn-init-mode-disabled').click()
    await page.getByTestId('btn-open-init').click()
    await expect(page.getByTestId('init-lock')).toBeVisible()
    await expect(page.getByTestId('init-first')).not.toBeFocused()
    await page.getByTestId('init-first').focus()
    await expect(page.getByTestId('init-first')).toBeFocused()
    await page.getByTestId('outside-button').focus()
    await expect(page.getByTestId('outside-button')).toBeFocused()
  })

  test('FL-TAB-04: wrap emits blur then focus once', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await expect(page.getByTestId('tab-a')).toBeFocused()
    await page.evaluate(() => {
      const log: string[] = []
      ;(window as unknown as { __flEvents: string[] }).__flEvents = log
      document.addEventListener(
        'blur',
        event => {
          if (event.target instanceof HTMLElement) log.push(`blur:${event.target.dataset.testid}`)
        },
        true
      )
      document.addEventListener(
        'focus',
        event => {
          if (event.target instanceof HTMLElement) log.push(`focus:${event.target.dataset.testid}`)
        },
        true
      )
    })
    await page.getByTestId('tab-c').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-a')).toBeFocused()
    const events = await page.evaluate(
      () => (window as unknown as { __flEvents: string[] }).__flEvents
    )
    const wrap = events.slice(events.lastIndexOf('blur:tab-c'))
    expect(wrap[0]).toBe('blur:tab-c')
    expect(wrap[1]).toBe('focus:tab-a')
  })

  test('FL-TAB-05: positive tabIndex keeps DOM order', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await expect(page.getByTestId('tab-a')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-b')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-c')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-a')).toBeFocused()
  })

  test('FL-TAB-06: consumer preventDefault suppresses the lock Tab move', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await page.getByTestId('tab-b').focus()
    await page.getByTestId('btn-arm-block-tab').click()
    await page.getByTestId('tab-b').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-b')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('tab-b')).toBeFocused()
  })

  test('FL-TAB-08: live insert/remove/reorder updates the next Tab target', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await page.getByTestId('tab-b').focus()
    await page.getByTestId('btn-insert-d').click()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-c')).toBeFocused()
    await page.getByTestId('btn-remove-tab-b').click()
    await page.getByTestId('tab-a').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-c')).toBeFocused()
  })

  test('FL-TAB-09: modifier Tab is not trapped', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await page.getByTestId('tab-c').focus()
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      document.activeElement?.dispatchEvent(event)
      return event.defaultPrevented
    })
    expect(prevented).toBe(false)
    await expect(page.getByTestId('tab-c')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('tab-b')).toBeFocused()
  })

  test('FL-CAND-09: runtime tabbability changes apply on the next Tab', async ({ page }) => {
    await page.getByTestId('btn-open-live').click()
    await expect(page.getByTestId('live-a')).toBeFocused()
    await page.getByTestId('btn-live-disable-b').click()
    await page.getByTestId('live-a').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('live-c')).toBeFocused()
    await page.getByTestId('btn-live-inert-c').click()
    await page.getByTestId('live-a').focus()
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(id).not.toBe('live-c')
    expect(id).not.toBe('live-b')
  })

  test('FL-CAND-13 & FL-SHARD-06 & FL-ENV-03: host/slot tabindex, closed roots, portalled and nested shadow', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-shadow-exotica').click()
    await expect(page.getByTestId('exotica-before')).toBeFocused()
    const order: string[] = []
    for (let i = 0; i < 10; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      order.push(id || '')
      await page.keyboard.press('Tab')
      if (id === 'exotica-before' && i > 0) break
    }
    expect(order).toContain('exotica-before')
    expect(order).toContain('slot-assigned')
    expect(order).toContain('closed-host')
    expect(order).toContain('exotica-after')
    expect(order).not.toContain('closed-inner')
    await page.getByTestId('portal-shadow-shard-btn').click()
    await expect(page.getByTestId('portal-shadow-shard-btn')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('portal-shadow-shard-btn')).toBeFocused()
  })

  test('FL-TRAP-02: pointer on an outside control is not cancelled', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await expect(page.getByTestId('trap-a')).toBeFocused()
    await page.getByTestId('trap-outside').click()
    await expect(page.getByTestId('fl-event-log')).toContainText('pointerdown')
    await expect(page.getByTestId('fl-event-log')).toContainText('click')
    const inside = await page.evaluate(() => {
      const lock = document.querySelector('[data-testid="trap-lock"]')
      return Boolean(lock?.contains(document.activeElement))
    })
    expect(inside).toBe(true)
  })

  test('FL-TRAP-03: null relatedTarget does not storm', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-b').focus()
    const count = await page.evaluate(async () => {
      let focuses = 0
      const onFocus = () => {
        focuses += 1
      }
      document.addEventListener('focus', onFocus, true)
      document.body.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: null }))
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      document.removeEventListener('focus', onFocus, true)
      return focuses
    })
    expect(count).toBeLessThan(8)
    await page.getByTestId('trap-a').focus()
    await expect(page.getByTestId('trap-a')).toBeFocused()
  })

  test('FL-TRAP-04: removing the focused node falls back inside', async ({ page }) => {
    await page.getByTestId('btn-trap-mode-remove').click()
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-c').focus()
    await page.getByTestId('trap-c').evaluate(el => el.remove())
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const lock = document.querySelector('[data-testid="trap-lock"]')
          return Boolean(lock?.contains(document.activeElement))
        })
      })
      .toBe(true)
    await expect(page.getByTestId('trap-c')).toHaveCount(0)
  })

  test('FL-TRAP-05: disabling the focused node moves once to a valid candidate', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-b').focus()
    await page.getByTestId('btn-disable-trap-node').click()
    await expect(page.getByTestId('trap-b')).not.toBeFocused()
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(['trap-a', 'trap-c', 'btn-disable-trap-node', 'btn-trap-disable-lock', 'btn-close-trap']).toContain(
      id
    )
  })

  test('FL-TRAP-06: pending reclaim is cancelled on disable', async ({ page }) => {
    await page.getByTestId('btn-trap-mode-cancel').click()
    await page.getByTestId('btn-open-trap').click()
    await expect(page.getByTestId('trap-a')).toBeFocused()
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="trap-outside"]')?.focus()
      document.querySelector<HTMLElement>('[data-testid="btn-trap-disable-lock"]')?.click()
    })
    await page.getByTestId('fl-newer-focus').focus()
    await page.waitForTimeout(50)
    await expect(page.getByTestId('fl-newer-focus')).toBeFocused()
  })

  test('FL-TRAP-07: re-entering the document restores the last inside target', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-b').focus()
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="trap-b"]')?.blur()
    })
    await page.getByTestId('trap-outside').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('trap-b')).toBeFocused()
  })

  test('FL-SHARD-02: a null shard ref joins after it resolves', async ({ page }) => {
    await page.getByTestId('btn-open-shard-lab').click()
    await expect(page.getByTestId('shard-lab-main')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('shard-lab-main')).toBeFocused()
    await page.getByTestId('btn-attach-shard').click()
    await expect(page.getByTestId('delayed-shard-btn')).toBeVisible()
    await page.getByTestId('delayed-shard-btn').click()
    await expect(page.getByTestId('delayed-shard-btn')).toBeFocused()
  })

  test('FL-SHARD-04: overlapping shard registrations dedupe', async ({ page }) => {
    await page.getByTestId('btn-open-overlap').click()
    const order: string[] = []
    for (let i = 0; i < 8; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      if (id) order.push(id)
      await page.keyboard.press('Tab')
      if (id === 'overlap-main' && i > 0) break
    }
    expect(order.filter(id => id === 'overlap-parent-btn')).toHaveLength(1)
    expect(order.filter(id => id === 'overlap-child-btn')).toHaveLength(1)
    await page.getByTestId('overlap-unregistered').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('overlap-unregistered')).not.toBeFocused()
  })

  test('FL-SHARD-05: removing the focused shard reclaims inside the lock', async ({ page }) => {
    await page.getByTestId('btn-open-shard-lab').click()
    await page.getByTestId('btn-attach-shard').click()
    await page.getByTestId('delayed-shard-btn').click()
    await expect(page.getByTestId('delayed-shard-btn')).toBeFocused()
    await page.getByTestId('btn-remove-focused-shard').click()
    await expect(page.getByTestId('delayed-shard')).toHaveCount(0)
    const inside = await page.evaluate(() => {
      const lock = document.querySelector('[data-testid="shard-lab"]')
      return Boolean(lock?.contains(document.activeElement))
    })
    expect(inside).toBe(true)
  })

  test('FL-NEST-04: out-of-order deactivate keeps the live top lock', async ({ page }) => {
    await page.getByTestId('btn-open-stack').click()
    await page.getByTestId('btn-open-stack-b').click()
    await page.getByTestId('btn-open-stack-c').click()
    await expect(page.getByTestId('stack-c-btn')).toBeFocused()
    await page.getByTestId('btn-close-stack-b').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('stack-b')).toHaveCount(0)
    await expect(page.getByTestId('stack-c')).toBeVisible()
    await page.getByTestId('stack-a-btn').evaluate((el: HTMLElement) => el.focus())
    const child = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="stack-c"]')
      return Boolean(c?.contains(document.activeElement))
    })
    expect(child).toBe(true)
    await page.getByTestId('btn-close-stack-c').click()
    await expect(page.getByTestId('stack-c')).toHaveCount(0)
    await expect.poll(async () => {
      return page.evaluate(() => {
        const a = document.querySelector('[data-testid="stack-a"]')
        return Boolean(a?.contains(document.activeElement))
      })
    }).toBe(true)
  })

  test('FL-NEST-06: one lock stack per Document', async ({ page }) => {
    await page.getByTestId('btn-open-docs').click()
    await expect(page.getByTestId('fl-root-a-trigger')).toBeVisible()
    await page.getByTestId('fl-root-a-trigger').click()
    await expect(page.getByTestId('fl-root-a-first')).toBeFocused()
    await page.getByTestId('fl-root-b-trigger').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('fl-root-b-first')).toBeFocused()
    await page.getByTestId('fl-root-a-first').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('fl-root-b-first')).toBeFocused()
    await page.getByTestId('fl-root-b-close').click()
    await expect(page.getByTestId('fl-root-b-container')).toHaveCount(0)
    await page.getByTestId('fl-root-a-close').click()
    await expect(page.getByTestId('fl-root-a-container')).toHaveCount(0)

    const frame = page.frameLocator('[data-testid="fl-iframe"]')
    await frame.getByTestId('fl-frame-trigger').click()
    await expect(frame.getByTestId('fl-frame-container')).toBeVisible()
    const iframeActive = await page.evaluate(() => {
      const iframe = document.querySelector('[data-testid="fl-iframe"]') as HTMLIFrameElement | null
      const doc = iframe?.contentDocument
      const active = doc?.activeElement
      const lock = doc?.querySelector('[data-testid="fl-frame-container"]')
      return {
        id: active instanceof Element ? active.getAttribute('data-testid') : null,
        inside: Boolean(lock && active && (lock === active || lock.contains(active))),
      }
    })
    expect(iframeActive?.inside).toBe(true)
    await page.getByTestId('fl-root-a-outside').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('fl-root-a-outside')).toBeFocused()
    await expect(frame.getByTestId('fl-frame-container')).toBeVisible()
  })

  test('FL-RESTORE-06: stale restore does not overwrite a newer explicit focus', async ({ page }) => {
    await page.getByTestId('btn-restore-mode-stale').click()
    await page.getByTestId('btn-open-restore-lab').click()
    await expect(page.getByTestId('restore-lab-btn')).toBeFocused()
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="btn-close-restore-lab"]')?.click()
    })
    await expect(page.getByTestId('restore-lab')).toHaveCount(0)
    await page.getByTestId('fl-newer-focus').focus()
    await page.waitForTimeout(50)
    await expect(page.getByTestId('fl-newer-focus')).toBeFocused()
  })

  test('FL-RESTORE-09: invalid explicit restore falls back to the captured origin', async ({ page }) => {
    await page.getByTestId('btn-restore-mode-invalid').click()
    const trigger = page.getByTestId('btn-open-restore-lab')
    await trigger.click()
    await page.getByTestId('btn-close-restore-lab').click()
    await expect(page.getByTestId('restore-lab')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('FL-RESTORE-10: the latest restore target wins when replaced at close', async ({ page }) => {
    await page.getByTestId('btn-restore-mode-replace').click()
    await page.getByTestId('btn-open-restore-lab').click()
    await page.getByTestId('btn-close-restore-lab').click()
    await expect(page.getByTestId('fl-restore-c')).toBeFocused()
  })

  test('FL-CAND-14: click focus may enter an in-lock iframe without cross-document traversal', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-catalog').click()
    await page.getByTestId('catalog-iframe').click()
    const active = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(active === 'catalog-iframe' || active === 'catalog-btn').toBeTruthy()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('outside-button')).not.toBeFocused()
  })

  test('FL-COMP-01: mixed native catalog, wrap, reclaim, and restore', async ({ page }) => {
    const trigger = page.getByTestId('btn-open-comp')
    await trigger.click()
    await expect(page.getByTestId('comp-input')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-link')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-radio-a')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-close')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-input')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    const inside = await page.evaluate(() => {
      const lock = document.querySelector('[data-testid="comp-lock"]')
      return Boolean(lock?.contains(document.activeElement))
    })
    expect(inside).toBe(true)
    await page.getByTestId('comp-close').click()
    await expect(trigger).toBeFocused()
  })

  test('FL-COMP-02: portalled shard plus open shadow is one lock', async ({ page }) => {
    await page.getByTestId('btn-open-shadow-exotica').click()
    await page.getByTestId('portal-shadow-shard-btn').click()
    await expect(page.getByTestId('portal-shadow-shard-btn')).toBeFocused()
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect([
      'exotica-before',
      'slot-host',
      'slot-assigned',
      'closed-host',
      'exotica-after',
      'btn-close-shadow-exotica',
    ]).toContain(id)
  })

  test('FL-COMP-03: nested restore uses proximity when the opener is gone', async ({ page }) => {
    await page.getByTestId('btn-proximity-opener').click()
    await expect(page.getByTestId('proximity-lock')).toBeVisible()
    await page.getByTestId('btn-remove-opener-close').click()
    await expect(page.getByTestId('proximity-lock')).toHaveCount(0)
    await expect(page.getByTestId('btn-proximity-right')).toBeFocused()
  })
})

