import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Presence', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceFixture')
  })

  test('PR-DOM-01 & PR-INSTANT-01: Renders child when present, removes immediately on instant close', async ({
    page,
  }) => {
    const instantBox = page.getByTestId('instant-box')
    await expect(instantBox).toBeVisible()
    await snap(page, 'initial-all-open')

    await page.getByTestId('btn-toggle-instant').click()
    // Should disappear immediately in the same cycle
    await expect(instantBox).toHaveCount(0)
    await snap(page, 'instant-removed')

    // Reopen
    await page.getByTestId('btn-toggle-instant').click()
    await expect(instantBox).toBeVisible()
    await snap(page, 'instant-reopened')
  })

  test('PR-TRANSITION-01: Retains closing child during CSS transition and removes after completion', async ({
    page,
  }) => {
    const transitionBox = page.getByTestId('transition-box')
    await expect(transitionBox).toBeVisible()
    await expect(transitionBox).toHaveAttribute('data-state', 'open')

    await page.getByTestId('btn-toggle-transition').click()

    // Immediately after click, it has data-state="closed" and is still in DOM during 300ms transition
    await expect(transitionBox).toHaveAttribute('data-state', 'closed')
    await expect(transitionBox).toBeVisible()
    await snap(page, 'transition-closing')

    // After transition completes, it unmounts from DOM
    await expect(transitionBox).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'transition-removed')
  })

  test('PR-ANIMATION-01: Retains closing child during CSS animation and removes after completion', async ({
    page,
  }) => {
    const animationBox = page.getByTestId('animation-box')
    await expect(animationBox).toBeVisible()
    await expect(animationBox).toHaveAttribute('data-state', 'open')

    await page.getByTestId('btn-toggle-animation').click()

    await expect(animationBox).toHaveAttribute('data-state', 'closed')
    await expect(animationBox).toBeVisible()
    await snap(page, 'animation-closing')

    await expect(animationBox).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'animation-removed')
  })

  test('PR-RACE-02: Preserves child when present returns true before exit completion', async ({
    page,
  }) => {
    const transitionBox = page.getByTestId('transition-box')
    await expect(transitionBox).toBeVisible()

    // Start exit
    await page.getByTestId('btn-toggle-transition').click()
    await expect(transitionBox).toHaveAttribute('data-state', 'closed')

    // Interrupt and reopen within 50ms
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-transition').click()

    // Should stay mounted and return to open state
    await expect(transitionBox).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(400)
    await expect(transitionBox).toBeVisible()
    await snap(page, 'transition-interrupted-reopened')
  })

  test('PR-NEST-01: Coordinates nested Presence instances and waits for child completion', async ({
    page,
  }) => {
    const parent = page.getByTestId('nested-parent')
    const child = page.getByTestId('nested-child')

    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    // Close parent (150ms) and child (350ms) together
    await page.getByTestId('btn-toggle-nested-parent').click()
    await page.getByTestId('btn-toggle-nested-child').click()

    // At 100ms both are still in DOM
    await page.waitForTimeout(100)
    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()
    await snap(page, 'nested-closing')

    // Eventually after child finishes (350ms+), both unmount
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(child).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'nested-removed')
  })

  test('PR-NEST-05: Exits a parent with an animated exit when a nested Presence was born closed', async ({
    mount,
    page,
  }) => {
    await mount('components/Presence/Presence/PresenceNestedBornClosedFixture')
    const parent = page.getByTestId('bornclosed-parent')

    await expect(parent).toBeVisible()
    await expect(page.getByTestId('bornclosed-child')).toHaveCount(0)

    await page.getByTestId('btn-toggle-bornclosed-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')

    // The never-opened nested child must not strand the 150ms parent exit.
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'bornclosed-removed')
  })

  test('PR-NEST-06: Coordinates a nested child that opens and closes during the parent exit', async ({
    mount,
    page,
  }) => {
    await mount('components/Presence/Presence/PresenceNestedBornClosedFixture')
    const parent = page.getByTestId('bornclosed-parent')
    const child = page.getByTestId('bornclosed-child')

    await expect(parent).toBeVisible()

    // Start the parent exit, then open and close the born-closed child mid-exit.
    await page.getByTestId('btn-toggle-bornclosed-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await page.getByTestId('btn-toggle-bornclosed-child').click()
    await expect(child).toBeVisible()
    await page.getByTestId('btn-toggle-bornclosed-child').click()
    await expect(child).toHaveAttribute('data-state', 'closed')

    // Both settle once the longer child exit completes.
    await expect(parent).toHaveCount(0, { timeout: 3000 })
    await expect(child).toHaveCount(0, { timeout: 3000 })
    await snap(page, 'bornclosed-coordinated-removed')
  })
})

test.describe('Presence onExitComplete (W-09)', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceExitCompleteFixture')
  })

  test('PR-EXIT-01: Fires onExitComplete exactly once after a completed transition exit', async ({
    page,
  }) => {
    const box = page.getByTestId('exit-transition-box')
    const count = page.getByTestId('exitcount-transition')
    await expect(box).toBeVisible()
    await expect(count).toHaveText('0')

    await page.getByTestId('btn-toggle-exit-transition').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')

    // No second fire from trailing end events.
    await page.waitForTimeout(600)
    await expect(count).toHaveText('1')
  })

  test('PR-EXIT-02: Fires onExitComplete for instant exits', async ({ page }) => {
    const box = page.getByTestId('exit-instant-box')
    const count = page.getByTestId('exitcount-instant')
    await expect(box).toBeVisible()

    await page.getByTestId('btn-toggle-exit-instant').click()
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('1')
  })

  test('PR-EXIT-03: Does not fire onExitComplete on interrupted exits', async ({
    page,
  }) => {
    const box = page.getByTestId('exit-interrupt-box')
    const count = page.getByTestId('exitcount-interrupt')
    await expect(box).toBeVisible()

    await page.getByTestId('btn-toggle-exit-interrupt').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-exit-interrupt').click()

    await expect(box).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(500)
    await expect(box).toBeVisible()
    await expect(count).toHaveText('0')

    // The next completed exit still fires exactly once.
    await page.getByTestId('btn-toggle-exit-interrupt').click()
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')
  })

  test('PR-EXIT-04: Does not fire onExitComplete on initial mount', async ({
    page,
  }) => {
    for (const id of [
      'exitcount-transition',
      'exitcount-instant',
      'exitcount-interrupt',
      'exitcount-wedge-parent',
      'exitcount-wedge-child',
      'exitcount-coord-parent',
      'exitcount-coord-child',
    ]) {
      await expect(page.getByTestId(id)).toHaveText('0')
    }
  })

  test('PR-EXIT-05: Fires through the born-closed nested wedge (B-01 overlay shape)', async ({
    page,
  }) => {
    const parent = page.getByTestId('exit-wedge-parent')
    const parentCount = page.getByTestId('exitcount-wedge-parent')
    const childCount = page.getByTestId('exitcount-wedge-child')

    await expect(parent).toBeVisible()
    await expect(page.getByTestId('exit-wedge-child')).toHaveCount(0)

    await page.getByTestId('btn-toggle-exit-wedge-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')
  })

  test('PR-EXIT-06: Fires once per Presence when nested parent and child exit together', async ({
    page,
  }) => {
    const parent = page.getByTestId('exit-coord-parent')
    const child = page.getByTestId('exit-coord-child')
    const parentCount = page.getByTestId('exitcount-coord-parent')
    const childCount = page.getByTestId('exitcount-coord-child')

    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    await page.getByTestId('btn-toggle-exit-coord-parent').click()
    await page.getByTestId('btn-toggle-exit-coord-child').click()

    await expect(parent).toHaveCount(0, { timeout: 3000 })
    await expect(child).toHaveCount(0, { timeout: 3000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('1')
  })
})

test.describe('Presence DOM contract (browser re-proof)', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceDomFixture')
  })

  test('PR-DOM-02: Omits its child when it first mounts with present false', async ({ page }) => {
    await expect(page.getByTestId('dom02-child')).toHaveCount(0)
    const slotHtml = await page.getByTestId('dom02-slot').evaluate(el => el.innerHTML)
    expect(slotHtml).toBe('')
    const refLog = await page.evaluate(() => (window as any).__dom02log)
    expect(refLog).toEqual([])
  })

  test('PR-DOM-03: Renders no host when its child is empty or falsy', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      const html = await page.getByTestId(`dom03-slot-${i}`).evaluate(el => el.innerHTML)
      expect(html).toBe('')
    }
  })

  test('PR-DOM-04: Leaves consumer props and behavior untouched when it observes a present child', async ({
    page,
  }) => {
    const child = page.getByTestId('dom04-child')
    await expect(child).toHaveAttribute('id', 'dom04-authored-id')
    await expect(child).toHaveAttribute('class', 'dom04-authored-class')
    await expect(child).toHaveAttribute('data-state', 'open')
    await expect(child).toHaveAttribute('data-custom', 'authored')
    await expect(child).toHaveCSS('color', 'rgb(1, 2, 3)')
    const slotChildren = await page.getByTestId('dom04-slot').evaluate(el => el.childElementCount)
    expect(slotChildren).toBe(1)

    await child.click()
    await expect(page.getByTestId('dom04-clicks')).toHaveText('1')
    await expect(child).toHaveAttribute('data-state', 'open')
    await expect(child).toHaveAttribute('class', 'dom04-authored-class')
  })

  test('PR-DOM-05: Observes only the current keyed child when a present child is replaced', async ({
    page,
  }) => {
    await expect(page.getByTestId('dom05-child-A')).toBeVisible()
    await page.getByTestId('btn-dom05-swap').click()
    await expect(page.getByTestId('dom05-child-A')).toHaveCount(0)
    await expect(page.getByTestId('dom05-child-B')).toBeVisible()

    // The gallery wraps stories in StrictMode, which double-invokes ref
    // callbacks on React 18/19 (single on 17), and stable composed refs
    // attribute the replaced fiber's detach to the current callback — so
    // assert the contract shape, not exact counts: A mounted first, the
    // swap detached and attached, and B is the current attachment.
    const log = await page.evaluate(() => (window as any).__dom05log as string[])
    const count = (e: string) => log.filter(x => x === e).length
    expect(log[0]).toBe('refA:attach')
    expect(count('refA:detach') + count('refB:detach')).toBeGreaterThanOrEqual(1)
    expect(count('refB:attach')).toBeGreaterThanOrEqual(1)
    expect(log[log.length - 1]).toBe('refB:attach')

    // A's previously captured exit event cannot remove the replacement.
    await page
      .getByTestId('dom05-child-B')
      .evaluate(el => el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true })))
    await expect(page.getByTestId('dom05-child-B')).toBeVisible()
    await expect(page.getByTestId('dom05-child-A')).toHaveCount(0)
  })
})

test.describe('Presence immediate removal', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceInstantFixture')
  })

  async function expectSameCommitRemoval(page: any, key: string) {
    const btn = page.getByTestId(`btn-toggle-${key}`)
    await btn.click()
    // The toggle flip proves React committed the close; same-commit removal
    // means the child is already gone with no frame, event, or timer wait.
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    const absent = await page.evaluate(
      (testId: string) => !document.querySelector(`[data-testid="${testId}"]`),
      `instant-${key}`
    )
    expect(absent).toBe(true)
  }

  test('PR-INSTANT-02: Removes immediately when the closed state has a zero-duration transition', async ({
    page,
  }) => {
    await expectSameCommitRemoval(page, 'i02')
  })

  test('PR-INSTANT-03: Removes immediately when the closed state has no effective CSS animation', async ({
    page,
  }) => {
    await expectSameCommitRemoval(page, 'i03a')
    await expectSameCommitRemoval(page, 'i03b')
  })

  test('PR-INSTANT-04: Avoids suspension when every comma-separated CSS effect has zero total duration', async ({
    page,
  }) => {
    await expectSameCommitRemoval(page, 'i04')
  })

  test('PR-INSTANT-05: Removes immediately when reduced-motion CSS computes every exit duration to zero', async ({
    page,
  }) => {
    // Control: without emulation the exit is a finite 300ms transition.
    const openDuration = await page
      .getByTestId('instant-i05')
      .evaluate(el => getComputedStyle(el).transitionDuration)
    expect(openDuration).toBe('0.3s')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches)

    // The media rule zeroes the closed duration from computed style alone
    // (Presence has no JS media-query branch for CSS). The harness floors
    // emulated durations at 10us instead of exactly 0s, so Presence — which
    // correctly treats any finite duration as finite — suspends for ~10us;
    // the exit still beats the 300ms natural duration by a wide margin.
    const closedDuration = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.className = 'i05'
      probe.setAttribute('data-state', 'closed')
      document.body.appendChild(probe)
      const d = getComputedStyle(probe).transitionDuration
      probe.remove()
      return d
    })
    expect(parseFloat(closedDuration)).toBeLessThan(0.001)

    const btn = page.getByTestId('btn-toggle-i05')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await page.waitForTimeout(100)
    const absent = await page.evaluate(() => !document.querySelector('[data-testid="instant-i05"]'))
    expect(absent).toBe(true)
  })

  test('PR-INSTANT-06: Does not strand an exiting child when the owner document is hidden', async ({
    page,
  }) => {
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
    })
    await expectSameCommitRemoval(page, 'i06')
    await page.waitForTimeout(300)
    await expect(page.getByTestId('instant-i06')).toHaveCount(0)
  })

  test('PR-INSTANT-07: Removes immediately when the closed state sets the observed child to display:none', async ({
    page,
  }) => {
    await expectSameCommitRemoval(page, 'i07')
  })
})

test.describe('Presence CSS transition exits', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceTransitionFixture')
  })

  test('PR-TRANSITION-02: Waits for both transition delay and duration when the closed effect is delayed', async ({
    page,
  }) => {
    const box = page.getByTestId('trans-t02')
    await page.getByTestId('btn-toggle-t02').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await expect(box).toHaveCount(1)
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-TRANSITION-03: Waits for the last property when a closing child transitions multiple properties', async ({
    page,
  }) => {
    const box = page.getByTestId('trans-t03')
    await page.getByTestId('btn-toggle-t03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await box.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await expect(box).toHaveCount(1)
    // The real 100ms opacity completion also leaves the child mounted.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-TRANSITION-04: Ignores descendant transition events when it observes a transitioning parent child', async ({
    page,
  }) => {
    const box = page.getByTestId('trans-t04')
    await page.getByTestId('btn-toggle-t04').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page
      .getByTestId('trans-t04-child')
      .evaluate(el => el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true })))
    await expect(box).toHaveCount(1)
    // The descendant's real 100ms transition ends while the parent still runs.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('trans-t04-child')).toHaveCount(0)
  })

  test('PR-TRANSITION-05: Completes a suspended exit when the observed transition is canceled', async ({
    page,
  }) => {
    const handle = await page.$('[data-testid="trans-t05"]')
    await page.getByTestId('btn-toggle-t05').click()
    await expect(page.getByTestId('trans-t05')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    await page.getByTestId('trans-t05').evaluate(el => ((el as HTMLElement).style.transition = 'none'))
    await expect(page.getByTestId('trans-t05')).toHaveCount(0, { timeout: 2000 })
    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(200)
    await expect(page.getByTestId('trans-t05')).toHaveCount(0)
  })

  test('PR-TRANSITION-06: Ignores unrelated perpetual transitions when only a finite close-state change defines the exit', async ({
    page,
  }) => {
    await page.getByTestId('btn-toggle-t06').click()
    await expect(page.getByTestId('trans-t06')).toHaveAttribute('data-state', 'closed')
    // The 100s color declaration never starts; removal tracks the 200ms close
    // transition and must beat the 5s fallback by a wide margin.
    await expect(page.getByTestId('trans-t06')).toHaveCount(0, { timeout: 2000 })
  })
})

test.describe('Presence CSS animation exits', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceAnimationFixture')
  })

  test('PR-ANIMATION-02: Avoids a final-frame flash when an exit animation has delay, iterations, and fill mode', async ({
    page,
  }) => {
    const box = page.getByTestId('anim-a02')
    await page.getByTestId('btn-toggle-a02').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await expect(box).toHaveCount(1)
    await page.waitForTimeout(100)
    await expect(box).toHaveCount(1)
    const fill = await box.evaluate(el => getComputedStyle(el).animationFillMode)
    expect(fill).toBe('backwards')
    await page.waitForTimeout(100)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-ANIMATION-03: Waits for all finite animations when a closing child runs more than one', async ({
    page,
  }) => {
    const box = page.getByTestId('anim-a03')
    await page.getByTestId('btn-toggle-a03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await box.evaluate(el =>
      el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'animFadeOut' }))
    )
    await expect(box).toHaveCount(1)
    // The real 200ms fade ends while the 400ms slide still runs.
    await page.waitForTimeout(250)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-ANIMATION-04: Removes immediately when the animation name does not change for the closed state', async ({
    page,
  }) => {
    const btn = page.getByTestId('btn-toggle-a04')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    const absent = await page.evaluate(() => !document.querySelector('[data-testid="anim-a04"]'))
    expect(absent).toBe(true)
  })

  test('PR-ANIMATION-05: Completes a suspended exit when the observed animation is canceled', async ({
    page,
  }) => {
    const handle = await page.$('[data-testid="anim-a05"]')
    await page.getByTestId('btn-toggle-a05').click()
    await expect(page.getByTestId('anim-a05')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    await page.getByTestId('anim-a05').evaluate(el => ((el as HTMLElement).style.animation = 'none'))
    await expect(page.getByTestId('anim-a05')).toHaveCount(0, { timeout: 2000 })
    await handle!.evaluate(el =>
      el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'animFadeOut' }))
    )
    await page.waitForTimeout(200)
    await expect(page.getByTestId('anim-a05')).toHaveCount(0)
  })

  test('PR-ANIMATION-06: Ignores a descendant animation completion when the observed child is still exiting', async ({
    page,
  }) => {
    const box = page.getByTestId('anim-a06')
    await page.getByTestId('btn-toggle-a06').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page
      .getByTestId('anim-a06-child')
      .evaluate(el =>
        el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'animSlideOut' }))
      )
    await expect(box).toHaveCount(1)
    // The descendant's real 100ms animation ends while the parent still runs.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('anim-a06-child')).toHaveCount(0)
  })

  test('PR-ANIMATION-07: Ignores infinite animations when a closing child also has finite exit effects', async ({
    page,
  }) => {
    // Infinity alone never suspends.
    const btnA = page.getByTestId('btn-toggle-a07a')
    await btnA.click()
    await expect(btnA).toHaveAttribute('aria-expanded', 'false')
    const absentA = await page.evaluate(() => !document.querySelector('[data-testid="anim-a07a"]'))
    expect(absentA).toBe(true)

    // Infinity plus a finite transition retains only until the finite effect ends.
    const boxB = page.getByTestId('anim-a07b')
    await page.getByTestId('btn-toggle-a07b').click()
    await expect(boxB).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    await expect(boxB).toHaveCount(1)
    await expect(boxB).toHaveCount(0, { timeout: 2000 })
  })
})

test.describe('Presence mixed and interrupted lifecycles', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceRaceFixture')
  })

  test('PR-RACE-01: Waits for both effect types when a closing child runs a transition and an animation', async ({
    page,
  }) => {
    const box = page.getByTestId('race-r01')
    await page.getByTestId('btn-toggle-r01').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    // The 200ms transition completes while the 400ms animation still runs.
    await page.waitForTimeout(250)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-RACE-03: Creates a fresh completion set when a child closes again after reopening', async ({
    page,
  }) => {
    const box = page.getByTestId('race-r03')
    const count = page.getByTestId('racecount-r03')
    await page.getByTestId('btn-toggle-r03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-r03').click()
    await expect(box).toHaveAttribute('data-state', 'open')
    await page.getByTestId('btn-toggle-r03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')

    // Exit A's stale completion cannot remove exit B's child.
    await page.waitForTimeout(50)
    const handle = await page.$('[data-testid="race-r03"]')
    await box.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')

    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(200)
    await expect(count).toHaveText('1')
  })

  test('PR-RACE-04: Ignores an entering animation completion when it races with a close commit', async ({
    mount,
    page,
  }) => {
    // Fresh mount so the 500ms enter animation is still running at close.
    await mount('components/Presence/Presence/PresenceRaceFixture')
    const box = page.getByTestId('race-r04')
    await expect(box).toBeVisible()
    await page.getByTestId('btn-toggle-r04').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await box.evaluate(el =>
      el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'raceEnter' }))
    )
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })

  test('PR-RACE-05: Releases lifecycle work when its observed child disappears externally during a suspended exit', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(String(err)))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const handle = await page.$('[data-testid="race-r05"]')
    await page.getByTestId('btn-toggle-r05').click()
    await expect(page.getByTestId('race-r05')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-r05-child').click()
    await expect(page.getByTestId('race-r05')).toHaveCount(0)

    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(300)
    await expect(page.getByTestId('race-r05')).toHaveCount(0)
    const slotHtml = await page.getByTestId('race-r05-slot').evaluate(el => el.innerHTML)
    expect(slotHtml).toBe('')
    expect(errors).toEqual([])
  })

  test('PR-RACE-06: Cleans up immediately when Presence itself unmounts during an exit', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(String(err)))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const handle = await page.$('[data-testid="race-r06"]')
    await page.getByTestId('btn-toggle-r06').click()
    await expect(page.getByTestId('race-r06')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-r06-mounted').click()
    await expect(page.getByTestId('race-r06')).toHaveCount(0)

    await handle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }))
    )
    await page.waitForTimeout(300)
    await expect(page.getByTestId('race-r06')).toHaveCount(0)
    const slotHtml = await page.getByTestId('race-r06-slot').evaluate(el => el.innerHTML)
    expect(slotHtml).toBe('')
    expect(errors).toEqual([])
  })
})

test.describe('Presence nested exit coordination (interrupt and removal)', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceNestExitFixture')
  })

  test('PR-NEST-02: Releases a descendant wait when that descendant returns to present during the parent exit', async ({
    page,
  }) => {
    const parent = page.getByTestId('nestexit-parent')
    const parentCount = page.getByTestId('nestexitcount-parent')
    const childCount = page.getByTestId('nestexitcount-child')
    const childHandle = await page.$('[data-testid="nestexit-child"]')

    await page.getByTestId('btn-toggle-nestexit-parent').click()
    await page.getByTestId('btn-toggle-nestexit-child').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    // The parent's own 150ms effect finishes while the child 350ms exit runs.
    await page.waitForTimeout(200)
    await expect(parent).toHaveCount(1)

    await page.getByTestId('btn-toggle-nestexit-child').click()
    // The canceled descendant exit no longer strands the still-closed parent:
    // the subtree removes once and the interrupted child never reports an exit.
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('nestexit-child')).toHaveCount(0)
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')

    await childHandle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'transform' }))
    )
    await page.waitForTimeout(200)
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')
  })

  test('PR-NEST-03: Releases a descendant registration when the exiting child is removed before completion', async ({
    page,
  }) => {
    const parent = page.getByTestId('nestexit-parent')
    const parentCount = page.getByTestId('nestexitcount-parent')
    const childCount = page.getByTestId('nestexitcount-child')
    const childHandle = await page.$('[data-testid="nestexit-child"]')

    await page.getByTestId('btn-toggle-nestexit-parent').click()
    await page.getByTestId('btn-toggle-nestexit-child').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)

    await page.getByTestId('btn-toggle-nestexit-child-mounted').click()
    await expect(page.getByTestId('nestexit-child')).toHaveCount(0)
    // The parent completes on its own 150ms effect without waiting for a
    // completion that can never arrive.
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')

    await childHandle!.evaluate(el =>
      el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'transform' }))
    )
    await page.waitForTimeout(200)
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')
  })
})

test.describe('Presence composition gates', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceCompFixture')
  })

  test('PR-COMP-01: Retains a fading composition when it exits through CSS keyframes', async ({
    page,
  }) => {
    const slotChildren = await page.getByTestId('comp-c01-slot').evaluate(el => el.childElementCount)
    expect(slotChildren).toBe(1)
    await page.getByTestId('comp-c01').evaluate(el => ((el as any).__mark = 'authored'))

    await page.getByTestId('btn-toggle-c01').click()
    const box = page.getByTestId('comp-c01')
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    const mark = await box.evaluate(el => (el as any).__mark)
    expect(mark).toBe('authored')
    const midOpacity = await box.evaluate(el => parseFloat(getComputedStyle(el).opacity))
    expect(midOpacity).toBeLessThan(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })

    // StrictMode double-invokes ref callbacks (React 18/19), so assert
    // symmetry: every attachment cleaned up exactly once, one final removal.
    const log = await page.evaluate(() => (window as any).__c01log as string[])
    const attaches = log.filter(e => e === 'attach').length
    const detaches = log.filter(e => e === 'detach').length
    expect(attaches).toBeGreaterThanOrEqual(1)
    expect(detaches).toBe(attaches)
  })

  test('PR-COMP-02: Retains a drawer composition when its closed state uses a transform transition', async ({
    page,
  }) => {
    const box = page.getByTestId('comp-c02')
    const count = page.getByTestId('compcount-c02')
    await page.getByTestId('btn-toggle-c02').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    // Past the 100ms delay and mid-flight: the drawer holds its closed position.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    const transform = await box.evaluate(el => getComputedStyle(el).transform)
    expect(transform).not.toBe('none')

    await page
      .getByTestId('comp-c02-inner')
      .evaluate(el =>
        el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'compInner' }))
      )
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')
  })

  test('PR-COMP-03: Preserves a reopened composition when reduced motion makes an interrupted exit instantaneous', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
    const box = page.getByTestId('comp-c03')
    const count = page.getByTestId('compcount-c03')
    const btn = page.getByTestId('btn-toggle-c03')

    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('1')

    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(box).toBeVisible()
    await expect(count).toHaveText('1')

    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('2')
  })
})

test.describe('Presence GSAP extension', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceGsapFixture')
  })

  test('PR-GSAP-01: Retains an exiting child until its finite GSAP tweens complete, and skips the wait under reduced motion', async ({
    page,
  }) => {
    await page.waitForFunction(() => !!(window as any).__presenceGsap)
    // Collapsible's exit shape: a GSAP-owned tween on the observed node with
    // no CSS effect. Presence must hold the child until the tween finishes.
    await page.evaluate(() => {
      const gsap = (window as any).__presenceGsap
      gsap.to('[data-testid="gsap-box"]', { opacity: 0, duration: 0.4, ease: 'none' })
    })
    await page.getByTestId('btn-toggle-gsap').click()
    const box = page.getByTestId('gsap-box')
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('gsapcount')).toHaveText('1')

    // Reduced motion gates the GSAP wait off: same tween, instant removal.
    const btn = page.getByTestId('btn-toggle-gsap')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(box).toBeVisible()
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
      const gsap = (window as any).__presenceGsap
      gsap.to('[data-testid="gsap-box"]', { opacity: 0, duration: 0.4, ease: 'none' })
    })
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    const absent = await page.evaluate(() => !document.querySelector('[data-testid="gsap-box"]'))
    expect(absent).toBe(true)
    await expect(page.getByTestId('gsapcount')).toHaveText('2')
  })
})
