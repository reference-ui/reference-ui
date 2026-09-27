// @vitest-environment happy-dom
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Collapsible } from './Collapsible'
import { Accordion } from '../Accordion'

describe('Collapsible Unit Contract', () => {
  // ---------------------------------------------------------------------------
  // DOM, linkage, and state
  // ---------------------------------------------------------------------------

  it('CO-DOM-05: Collapsible should honor an explicit Content ID as the control target', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content id="billing-details" data-testid="content">
            Content
          </Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('[data-testid="trigger"]')!
    const content = container.querySelector('[data-testid="content"]')!

    expect(content.getAttribute('id')).toBe('billing-details')
    expect(trigger.getAttribute('aria-controls')).toBe('billing-details')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-DOM-06: Collapsible should update generated linkage atomically when an explicit Content ID changes or disappears', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    // 1. Initial render with no Content ID (generated ID)
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Initial</Collapsible.Content>
        </Collapsible>
      )
    })

    let trigger = container.querySelector('[data-testid="trigger"]')!
    let content = container.querySelector('[data-testid="content"]')!
    const generatedId = content.getAttribute('id')!
    expect(generatedId).toBeTruthy()
    expect(trigger.getAttribute('aria-controls')).toBe(generatedId)

    // 2. Rerender with id="first-panel"
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content id="first-panel" data-testid="content">
            First
          </Collapsible.Content>
        </Collapsible>
      )
    })
    expect(content.getAttribute('id')).toBe('first-panel')
    expect(trigger.getAttribute('aria-controls')).toBe('first-panel')
    expect(container.querySelector(`#${generatedId}`)).toBeNull()

    // 3. Rerender with id="second-panel"
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content id="second-panel" data-testid="content">
            Second
          </Collapsible.Content>
        </Collapsible>
      )
    })
    expect(content.getAttribute('id')).toBe('second-panel')
    expect(trigger.getAttribute('aria-controls')).toBe('second-panel')
    expect(container.querySelector('#first-panel')).toBeNull()

    // 4. Rerender back to no ID (should restore stable generated ID)
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Restored</Collapsible.Content>
        </Collapsible>
      )
    })
    expect(content.getAttribute('id')).toBe(generatedId)
    expect(trigger.getAttribute('aria-controls')).toBe(generatedId)
    expect(container.querySelector('#second-panel')).toBeNull()

    // 5. Subsequent rerender preserves that same generated ID
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Restored 2</Collapsible.Content>
        </Collapsible>
      )
    })
    expect(content.getAttribute('id')).toBe(generatedId)
    expect(trigger.getAttribute('aria-controls')).toBe(generatedId)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-DOM-07: Collapsible should generate instance-safe linkage for disclosures with identical content', async () => {
    const container1 = document.createElement('div')
    const container2 = document.createElement('div')
    document.body.appendChild(container1)
    document.body.appendChild(container2)
    const root1 = createRoot(container1)
    const root2 = createRoot(container2)

    await React.act(async () => {
      root1.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger1">Label</Collapsible.Trigger>
          <Collapsible.Content data-testid="content1">Identical Text</Collapsible.Content>
        </Collapsible>
      )
      root2.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="trigger2">Label</Collapsible.Trigger>
          <Collapsible.Content data-testid="content2">Identical Text</Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger1 = container1.querySelector('[data-testid="trigger1"]')!
    const content1 = container1.querySelector('[data-testid="content1"]')!
    const trigger2 = container2.querySelector('[data-testid="trigger2"]')!
    const content2 = container2.querySelector('[data-testid="content2"]')!

    const id1 = content1.getAttribute('id')
    const id2 = content2.getAttribute('id')

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
    expect(trigger1.getAttribute('aria-controls')).toBe(id1)
    expect(trigger2.getAttribute('aria-controls')).toBe(id2)

    await React.act(async () => {
      root1.unmount()
    })
    await React.act(async () => {
      root2.unmount()
    })
    container1.remove()
    container2.remove()
  })

  it('CO-DOM-08: Collapsible should forward native props and refs to the fixed Trigger and Content elements', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    let triggerClickCount = 0
    let contentClickCount = 0
    let triggerRefReceived: HTMLButtonElement | null = null
    let contentRefReceived: HTMLDivElement | null = null
    const triggerCallbackCleanup = vi.fn()

    const triggerCallbackRef = (el: HTMLButtonElement | null) => {
      triggerRefReceived = el
      return triggerCallbackCleanup
    }

    const contentObjectRef = { current: null as HTMLDivElement | null }

    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger
            ref={triggerCallbackRef}
            data-custom="trigger-custom"
            aria-label="Custom trigger"
            className="my-trigger-class"
            style={{ color: 'red' }}
            onClick={() => {
              triggerClickCount++
            }}
          >
            Trigger
          </Collapsible.Trigger>
          <Collapsible.Content
            ref={contentObjectRef}
            data-custom="content-custom"
            aria-label="Custom content"
            className="my-content-class"
            style={{ color: 'blue' }}
            onClick={() => {
              contentClickCount++
            }}
          >
            Content
          </Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('button')! as HTMLButtonElement
    const content = container.querySelector('div[data-custom="content-custom"]')! as HTMLDivElement

    expect(trigger.tagName.toLowerCase()).toBe('button')
    expect(trigger.getAttribute('data-custom')).toBe('trigger-custom')
    expect(trigger.getAttribute('aria-label')).toBe('Custom trigger')
    expect(trigger.classList.contains('my-trigger-class')).toBe(true)
    expect(trigger.style.color).toBe('red')
    expect(triggerRefReceived).toBe(trigger)

    expect(content.tagName.toLowerCase()).toBe('div')
    expect(content.getAttribute('data-custom')).toBe('content-custom')
    expect(content.getAttribute('aria-label')).toBe('Custom content')
    expect(content.classList.contains('my-content-class')).toBe(true)
    expect(content.style.color).toBe('blue')
    expect(contentObjectRef.current).toBe(content)

    React.act(() => {
      trigger.click()
    })
    expect(triggerClickCount).toBe(1)
    React.act(() => {
      content.click()
    })
    expect(contentClickCount).toBe(1)

    // Rerender once
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger
            ref={triggerCallbackRef}
            data-custom="trigger-custom"
            aria-label="Custom trigger"
            className="my-trigger-class"
            style={{ color: 'red' }}
          >
            Trigger
          </Collapsible.Trigger>
          <Collapsible.Content
            ref={contentObjectRef}
            data-custom="content-custom"
            aria-label="Custom content"
            className="my-content-class"
            style={{ color: 'blue' }}
          >
            Content
          </Collapsible.Content>
        </Collapsible>
      )
    })

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-DOM-09: Collapsible should tolerate either authored part being absent without inventing markup', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    // 1. Trigger-only: no content, no dangling aria-controls, no extra host
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="solo-trigger">Solo Trigger</Collapsible.Trigger>
        </Collapsible>
      )
    })

    const soloTrigger = container.querySelector('[data-testid="solo-trigger"]')!
    expect(soloTrigger).not.toBeNull()
    expect(soloTrigger.getAttribute('aria-controls')).toBeNull()
    expect(container.children.length).toBe(1)

    // 2. Content-only with open=true: no trigger invented
    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Content data-testid="solo-content">Solo Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const soloContent = container.querySelector('[data-testid="solo-content"]')!
    expect(soloContent).not.toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.children.length).toBe(1)

    // 3. Empty Collapsible: no host or substitutes
    await React.act(async () => {
      root.render(<Collapsible open={true}></Collapsible>)
    })
    expect(container.innerHTML).toBe('')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-DOM-10: Collapsible should keep its trigger non-submitting unless the application explicitly chooses submission', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    let submitCount = 0
    let changeCount = 0

    // 1. Omit Trigger type inside form -> defaults to button[type="button"], does not submit
    await React.act(async () => {
      root.render(
        <form
          onSubmit={e => {
            e.preventDefault()
            submitCount++
          }}
        >
          <Collapsible open={false} onChange={() => changeCount++}>
            <Collapsible.Trigger data-testid="btn">Toggle</Collapsible.Trigger>
            <Collapsible.Content>Details</Collapsible.Content>
          </Collapsible>
        </form>
      )
    })

    const btn = container.querySelector('[data-testid="btn"]') as HTMLButtonElement
    expect(btn.type).toBe('button')
    React.act(() => {
      btn.click()
    })
    expect(changeCount).toBe(1)
    expect(submitCount).toBe(0)

    // 2. Explicit type="submit" -> preserves native submission
    await React.act(async () => {
      root.render(
        <form
          onSubmit={e => {
            e.preventDefault()
            submitCount++
          }}
        >
          <Collapsible open={false} onChange={() => changeCount++}>
            <Collapsible.Trigger type="submit" data-testid="btn">
              Submit Toggle
            </Collapsible.Trigger>
            <Collapsible.Content>Details</Collapsible.Content>
          </Collapsible>
        </form>
      )
    })

    expect(btn.type).toBe('submit')
    React.act(() => {
      btn.click()
    })
    expect(changeCount).toBe(2)
    expect(submitCount).toBe(1)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Controlled activation
  // ---------------------------------------------------------------------------

  it('CO-ACT-04: Collapsible should leave controlled rendering unchanged when its parent ignores a toggle request', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const closedRequests: boolean[] = []
    const openRequests: boolean[] = []

    await React.act(async () => {
      root.render(
        <div>
          <Collapsible open={false} onChange={val => closedRequests.push(val)}>
            <Collapsible.Trigger data-testid="closed-trigger">Closed</Collapsible.Trigger>
            <Collapsible.Content data-testid="closed-content">Content</Collapsible.Content>
          </Collapsible>

          <Collapsible open={true} onChange={val => openRequests.push(val)}>
            <Collapsible.Trigger data-testid="open-trigger">Open</Collapsible.Trigger>
            <Collapsible.Content data-testid="open-content">Content</Collapsible.Content>
          </Collapsible>
        </div>
      )
    })

    const closedTrigger = container.querySelector('[data-testid="closed-trigger"]') as HTMLButtonElement
    const openTrigger = container.querySelector('[data-testid="open-trigger"]') as HTMLButtonElement

    React.act(() => {
      closedTrigger.click()
    })
    React.act(() => {
      openTrigger.click()
    })

    expect(closedRequests).toEqual([true])
    expect(openRequests).toEqual([false])

    // Parent did not update open props; DOM must remain strictly reflection of props
    expect(closedTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(closedTrigger.getAttribute('data-state')).toBe('closed')
    expect(container.querySelector('[data-testid="closed-content"]')).toBeNull()

    expect(openTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(openTrigger.getAttribute('data-state')).toBe('open')
    expect(container.querySelector('[data-testid="open-content"]')).not.toBeNull()

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ACT-05: Collapsible should follow programmatic controlled state without echoing a change request', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: boolean[] = []

    const renderWith = async (open: boolean) => {
      await React.act(async () => {
        root.render(
          <Collapsible open={open} onChange={val => requests.push(val)}>
            <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
            <Collapsible.Content data-testid="content">Content</Collapsible.Content>
          </Collapsible>
        )
      })
    }

    // GSAP owns exit motion: a close commit suspends unmount until the tween
    // completes (happy-dom never pumps it), so closed content is either absent
    // or a closed exiting node. The case pins controlled-following + no echo.
    const expectClosedContent = () => {
      const node = container.querySelector('[data-testid="content"]')
      if (node) {
        expect(node.getAttribute('data-state')).toBe('closed')
      }
    }

    await renderWith(false)
    let trigger = container.querySelector('[data-testid="trigger"]')!
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    await renderWith(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    await renderWith(false)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expectClosedContent()

    await renderWith(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    expect(requests).toEqual([])

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ACT-06: Collapsible should run the consumer Trigger click handler before deciding whether to request a toggle', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const log: string[] = []
    let shouldPrevent = false

    const handleConsumerClick = (e: React.MouseEvent) => {
      log.push('onClick')
      if (shouldPrevent) {
        e.preventDefault()
      }
    }

    const handleChange = (nextOpen: boolean) => {
      log.push(`onChange(${nextOpen})`)
    }

    await React.act(async () => {
      root.render(
        <Collapsible open={false} onChange={handleChange}>
          <Collapsible.Trigger onClick={handleConsumerClick} data-testid="trigger">
            Toggle
          </Collapsible.Trigger>
          <Collapsible.Content>Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    // Normal click: onClick then onChange(true)
    React.act(() => {
      trigger.click()
    })
    expect(log).toEqual(['onClick', 'onChange(true)'])

    // Prevented click: onClick only, controlled state unchanged
    log.length = 0
    shouldPrevent = true
    React.act(() => {
      trigger.click()
    })
    expect(log).toEqual(['onClick'])
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ACT-07: Collapsible should block activation without overriding a controlled open value when disabled', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: boolean[] = []

    await React.act(async () => {
      root.render(
        <Collapsible disabled={true} open={true} onChange={val => requests.push(val)}>
          <Collapsible.Trigger data-testid="trigger">Disabled Open</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const content = container.querySelector('[data-testid="content"]')!

    expect(trigger.disabled).toBe(true)
    expect(trigger.getAttribute('data-disabled')).toBe('')
    expect(content.getAttribute('data-state')).toBe('open')

    React.act(() => {
      trigger.click()
    })
    expect(requests).toEqual([])
    expect(content).not.toBeNull()

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ACT-08: Collapsible should ignore input that is not native trigger activation', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: boolean[] = []

    await React.act(async () => {
      root.render(
        <div>
          <Collapsible open={false} onChange={val => requests.push(val)}>
            <Collapsible.Trigger data-testid="trigger">Trigger</Collapsible.Trigger>
            <Collapsible.Content data-testid="content">Content</Collapsible.Content>
          </Collapsible>
          <button data-testid="outside-btn">Outside</button>
        </div>
      )
    })

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    const outsideBtn = container.querySelector('[data-testid="outside-btn"]') as HTMLButtonElement

    // Auxiliary pointer buttons (e.g. right click / button 2)
    React.act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { button: 1, bubbles: true }))
    })
    React.act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { button: 2, bubbles: true }))
    })

    // Arrow keys, Escape
    React.act(() => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    React.act(() => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    React.act(() => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    })

    // Outside button click
    React.act(() => {
      outsideBtn.click()
    })

    expect(requests).toEqual([])

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ACT-09: Collapsible should activate against the latest controlled value and callback after rerender', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const callbackA = vi.fn()
    const callbackB = vi.fn()
    const callbackC = vi.fn()

    // Render closed with callback A
    await React.act(async () => {
      root.render(
        <Collapsible open={false} onChange={callbackA}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content>Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    // Rerender open with callback B without replacing Trigger
    await React.act(async () => {
      root.render(
        <Collapsible open={true} onChange={callbackB}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content>Content</Collapsible.Content>
        </Collapsible>
      )
    })

    React.act(() => {
      trigger.click()
    })
    expect(callbackA).not.toHaveBeenCalled()
    expect(callbackB).toHaveBeenCalledWith(false)
    expect(callbackC).not.toHaveBeenCalled()

    // Rerender closed with callback C and click again
    await React.act(async () => {
      root.render(
        <Collapsible open={false} onChange={callbackC}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content>Content</Collapsible.Content>
        </Collapsible>
      )
    })

    React.act(() => {
      trigger.click()
    })
    expect(callbackA).not.toHaveBeenCalled()
    expect(callbackB).toHaveBeenCalledTimes(1)
    expect(callbackC).toHaveBeenCalledWith(true)

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ACT-10: Standalone Collapsible with omitted state starts closed and toggles through its internal store (re-targeted: quarantine controlled-only does not apply, uncontrolled API preserved)', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: boolean[] = []

    // Outside Accordion, omit open, provide onChange
    await React.act(async () => {
      root.render(
        <Collapsible onChange={val => requests.push(val)}>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="content"]')).toBeNull()

    // Activate: requests true AND opens via the internal uncontrolled store
    React.act(() => {
      trigger.click()
    })
    expect(requests).toEqual([true])
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    // Rerender with onChange omitted, activate again safely (still toggles, now closed)
    await React.act(async () => {
      root.render(
        <Collapsible>
          <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Content</Collapsible.Content>
        </Collapsible>
      )
    })

    expect(() => {
      React.act(() => {
        trigger.click()
      })
    }).not.toThrow()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Presence lifecycle & cleanup
  // ---------------------------------------------------------------------------

  it('CO-PRES-06: Collapsible should clean up immediately when the whole disclosure disappears during exit', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    let contentDetachedNode: HTMLDivElement | null = null
    const refCleanup = vi.fn()

    const contentCallbackRef = (el: HTMLDivElement | null) => {
      if (el) {
        contentDetachedNode = el
        return refCleanup
      }
      refCleanup()
    }

    await React.act(async () => {
      root.render(
        <Collapsible open={true}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Content ref={contentCallbackRef}>
            Exit in progress
          </Collapsible.Content>
        </Collapsible>
      )
    })

    expect(contentDetachedNode).not.toBeNull()

    // Unmount the whole Collapsible before exit completes
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await React.act(async () => {
      root.render(<div>Unrelated</div>)
    })

    expect(container.contains(contentDetachedNode!)).toBe(false)
    expect(refCleanup).toHaveBeenCalled()

    // Dispatch late transitionend on detached node
    React.act(() => {
      contentDetachedNode!.dispatchEvent(new Event('transitionend', { bubbles: true }))
    })
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()

    warnSpy.mockRestore()
    errorSpy.mockRestore()
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Measured-size styling & SSR
  // ---------------------------------------------------------------------------

  it('CO-SIZE-04: Collapsible should defer layout measurements until after hydration', async () => {
    const changeSpy = vi.fn()

    // 1. Server-render open=true Content
    const ssrHtml = renderToString(
      <Collapsible open={true} onChange={changeSpy}>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">Content</Collapsible.Content>
      </Collapsible>
    )

    // Server markup omits both custom properties
    expect(ssrHtml).not.toContain('--reference-collapsible-content-height')
    expect(ssrHtml).not.toContain('--reference-collapsible-content-width')

    // 2. Hydrate client
    const container = document.createElement('div')
    container.innerHTML = ssrHtml
    document.body.appendChild(container)

    let hydratedRoot: any
    await React.act(async () => {
      hydratedRoot = hydrateRoot(
        container,
        <Collapsible open={true} onChange={changeSpy}>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content data-testid="content">Content</Collapsible.Content>
        </Collapsible>
      )
    })

    // onChange was not triggered by hydration or measurement
    expect(changeSpy).not.toHaveBeenCalled()

    await React.act(async () => {
      hydratedRoot.unmount()
    })
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Nesting and environments
  // ---------------------------------------------------------------------------

  it('CO-NEST-01: Nested standalone Collapsibles should keep state, callbacks, and linkage independent', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const outerRequests: boolean[] = []
    const innerRequests: boolean[] = []

    await React.act(async () => {
      root.render(
        <Collapsible open={true} onChange={val => outerRequests.push(val)}>
          <Collapsible.Trigger data-testid="outer-trigger">Outer</Collapsible.Trigger>
          <Collapsible.Content data-testid="outer-content">
            <Collapsible open={false} onChange={val => innerRequests.push(val)}>
              <Collapsible.Trigger data-testid="inner-trigger">Inner</Collapsible.Trigger>
              <Collapsible.Content data-testid="inner-content">Inner Content</Collapsible.Content>
            </Collapsible>
          </Collapsible.Content>
        </Collapsible>
      )
    })

    const outerTrigger = container.querySelector('[data-testid="outer-trigger"]')!
    const innerTrigger = container.querySelector('[data-testid="inner-trigger"]') as HTMLButtonElement
    const outerContent = container.querySelector('[data-testid="outer-content"]')!

    const outerContentId = outerContent.getAttribute('id')!
    expect(outerTrigger.getAttribute('aria-controls')).toBe(outerContentId)

    // Click inner Trigger
    React.act(() => {
      innerTrigger.click()
    })
    expect(innerRequests).toEqual([true])
    expect(outerRequests).toEqual([])

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-NEST-02: A Collapsible inside Accordion should defer expansion authority to the Accordion root while preserving disclosure anatomy', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const accordionRequests: any[] = []

    const renderWith = async (value: string | null) => {
      await React.act(async () => {
        root.render(
          <Accordion expansion="single" value={value} onChange={val => accordionRequests.push(val)}>
            <Accordion.Item id="item-1">
              <Collapsible.Trigger data-testid="item-1-trigger">Item 1</Collapsible.Trigger>
              <Collapsible.Content data-testid="item-1-content">Item 1 Content</Collapsible.Content>
            </Accordion.Item>
          </Accordion>
        )
      })
    }

    // 1. Initially closed (value = null)
    await renderWith(null)
    const trigger = container.querySelector('[data-testid="item-1-trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="item-1-content"]')).toBeNull()

    // 2. Click trigger: Accordion root onChange receives item id
    React.act(() => {
      trigger.click()
    })
    expect(accordionRequests).toEqual(['item-1'])

    // 3. Parent rejects first request (keeps value = null) -> stays closed
    await renderWith(null)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="item-1-content"]')).toBeNull()

    // 4. Parent accepts second request (sets value = "item-1") -> opens
    await renderWith('item-1')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-state')).toBe('open')
    const content = container.querySelector('[data-testid="item-1-content"]')!
    expect(content).not.toBeNull()
    expect(content.getAttribute('data-state')).toBe('open')

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CO-ENV-01: Collapsible should hydrate open and closed disclosure relationships without changing identity', async () => {
    const openHtml = renderToString(
      <Collapsible open={true}>
        <Collapsible.Trigger data-testid="open-trig">Open</Collapsible.Trigger>
        <Collapsible.Content data-testid="open-cont">Open Content</Collapsible.Content>
      </Collapsible>
    )

    const closedHtml = renderToString(
      <Collapsible open={false}>
        <Collapsible.Trigger data-testid="closed-trig">Closed</Collapsible.Trigger>
        <Collapsible.Content data-testid="closed-cont">Closed Content</Collapsible.Content>
      </Collapsible>
    )

    const containerOpen = document.createElement('div')
    containerOpen.innerHTML = openHtml
    document.body.appendChild(containerOpen)

    const containerClosed = document.createElement('div')
    containerClosed.innerHTML = closedHtml
    document.body.appendChild(containerClosed)

    let rootOpen: any
    let rootClosed: any

    await React.act(async () => {
      rootOpen = hydrateRoot(
        containerOpen,
        <Collapsible open={true}>
          <Collapsible.Trigger data-testid="open-trig">Open</Collapsible.Trigger>
          <Collapsible.Content data-testid="open-cont">Open Content</Collapsible.Content>
        </Collapsible>
      )
      rootClosed = hydrateRoot(
        containerClosed,
        <Collapsible open={false}>
          <Collapsible.Trigger data-testid="closed-trig">Closed</Collapsible.Trigger>
          <Collapsible.Content data-testid="closed-cont">Closed Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const openTrigger = containerOpen.querySelector('[data-testid="open-trig"]')!
    const openContent = containerOpen.querySelector('[data-testid="open-cont"]')!
    const closedTrigger = containerClosed.querySelector('[data-testid="closed-trig"]')!

    expect(openTrigger.getAttribute('aria-controls')).toBe(openContent.getAttribute('id'))
    expect(closedTrigger.getAttribute('aria-controls')).toBeNull()

    await React.act(async () => {
      rootOpen.unmount()
    })
    await React.act(async () => {
      rootClosed.unmount()
    })
    containerOpen.remove()
    containerClosed.remove()
  })

  it('CO-ENV-02: Collapsible should keep one registration and request across supported React versions and StrictMode replay', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: boolean[] = []
    let refCallCount = 0

    const triggerRef = (el: HTMLButtonElement | null) => {
      if (el) refCallCount++
    }

    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <Collapsible open={false} onChange={val => requests.push(val)}>
            <Collapsible.Trigger ref={triggerRef} data-testid="strict-trigger">
              Toggle
            </Collapsible.Trigger>
            <Collapsible.Content>Content</Collapsible.Content>
          </Collapsible>
        </React.StrictMode>
      )
    })

    const trigger = container.querySelector('[data-testid="strict-trigger"]') as HTMLButtonElement
    React.act(() => {
      trigger.click()
    })

    // StrictMode effect replay must not duplicate user request
    expect(requests).toEqual([true])

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('B-12: Collapsible should fire both onChange and onOpenChange when both are passed', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const order: string[] = []
    await React.act(async () => {
      root.render(
        <Collapsible
          open={false}
          onChange={val => void order.push(`onChange(${val})`)}
          onOpenChange={val => void order.push(`onOpenChange(${val})`)}
        >
          <Collapsible.Trigger data-testid="both-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content>Content</Collapsible.Content>
        </Collapsible>
      )
    })

    const trigger = container.querySelector('[data-testid="both-trigger"]') as HTMLButtonElement
    React.act(() => {
      trigger.click()
    })

    // Non-breaking: onChange keeps its old position, onOpenChange is no
    // longer silently dropped.
    expect(order).toEqual(['onChange(true)', 'onOpenChange(true)'])

    await React.act(async () => {
      root.unmount()
    })
    container.remove()

    // Either handler alone behaves exactly as before.
    const solo = document.createElement('div')
    document.body.appendChild(solo)
    const soloRoot = createRoot(solo)
    const soloRequests: boolean[] = []
    await React.act(async () => {
      soloRoot.render(
        <Collapsible open={false} onOpenChange={val => void soloRequests.push(val)}>
          <Collapsible.Trigger data-testid="solo-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content>Content</Collapsible.Content>
        </Collapsible>
      )
    })
    const soloTrigger = solo.querySelector('[data-testid="solo-trigger"]') as HTMLButtonElement
    React.act(() => {
      soloTrigger.click()
    })
    expect(soloRequests).toEqual([true])
    await React.act(async () => {
      soloRoot.unmount()
    })
    solo.remove()
  })
})
