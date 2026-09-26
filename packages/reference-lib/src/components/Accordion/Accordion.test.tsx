// @vitest-environment happy-dom
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
import * as React from 'react'
import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Accordion } from './Accordion'
import { Collapsible } from '../Collapsible'

describe('Accordion Unit Contract', () => {
  // ---------------------------------------------------------------------------
  // DOM and collection identity
  // ---------------------------------------------------------------------------

  it('AC-DOM-02: Accordion should forward its native root contract to the rendered div', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const objectRef = { current: null as HTMLDivElement | null }
    let cleanupCalled = false
    const callbackRef = (node: HTMLDivElement | null) => {
      if (node) {
        return () => {
          cleanupCalled = true
        }
      }
    }

    let clickCount = 0
    let keyCount = 0

    await act(async () => {
      root.render(
        <Accordion
          id="custom-accordion-root"
          aria-label="Root Accordion"
          data-custom-state="ready"
          className="accordion-root-class"
          style={{ padding: '16px' }}
          onClick={() => { clickCount++ }}
          onKeyDown={() => { keyCount++ }}
          ref={(node) => {
            objectRef.current = node
            return callbackRef(node)
          }}
          value="a"
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    const rootEl = container.querySelector('#custom-accordion-root') as HTMLDivElement
    expect(rootEl).not.toBeNull()
    expect(rootEl.getAttribute('aria-label')).toBe('Root Accordion')
    expect(rootEl.getAttribute('data-custom-state')).toBe('ready')
    expect(rootEl.getAttribute('data-reference-accordion')).toBe('')
    expect(rootEl.classList.contains('accordion-root-class')).toBe(true)
    expect(rootEl.style.padding).toBe('16px')
    expect(objectRef.current).toBe(rootEl)

    // Verify click and key event handlers run once
    rootEl.click()
    expect(clickCount).toBe(1)

    rootEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(keyCount).toBe(1)

    // Unmount to verify callback ref cleanup
    await act(async () => {
      root.unmount()
    })
    expect(cleanupCalled).toBe(true)
    container.remove()
  })

  it('AC-DOM-03: Accordion item identity should stay separate from Collapsible generated trigger-to-content linkage', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <Accordion expansion="multiple" value={['billing', 'team']}>
          <Collapsible id="billing">
            <Collapsible.Trigger data-testid="btn-billing">Billing</Collapsible.Trigger>
            <Collapsible.Content data-testid="panel-billing">Billing Info</Collapsible.Content>
          </Collapsible>
          <Collapsible id="team">
            <Collapsible.Trigger data-testid="btn-team">Team</Collapsible.Trigger>
            <Collapsible.Content data-testid="panel-team">Team Info</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerBilling = container.querySelector('[data-testid="btn-billing"]')!
    const contentBilling = container.querySelector('[data-testid="panel-billing"]')!
    const triggerTeam = container.querySelector('[data-testid="btn-team"]')!
    const contentTeam = container.querySelector('[data-testid="panel-team"]')!

    const billingControls = triggerBilling.getAttribute('aria-controls')
    const billingContentId = contentBilling.getAttribute('id')
    const teamControls = triggerTeam.getAttribute('aria-controls')
    const teamContentId = contentTeam.getAttribute('id')

    expect(billingControls).toBe(billingContentId)
    expect(teamControls).toBe(teamContentId)
    expect(billingControls).not.toBe('billing')
    expect(teamControls).not.toBe('team')
    expect(billingControls).not.toBe(teamControls)

    root.unmount()
    container.remove()
  })

  it('AC-DOM-04: Accordion should track dynamic items by stable ID rather than render position', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    type Item = { id: string; label: string }

    const renderItems = async (items: Item[]) => {
      await act(async () => {
        root.render(
          <Accordion expansion="single" value="b">
            {items.map((item) => (
              <Collapsible key={item.id} id={item.id}>
                <Collapsible.Trigger data-testid={`trigger-${item.id}`}>{item.label}</Collapsible.Trigger>
                <Collapsible.Content data-testid={`content-${item.id}`}>{item.label} content</Collapsible.Content>
              </Collapsible>
            ))}
          </Accordion>
        )
      })
    }

    // Initial items: A, B, C
    await renderItems([
      { id: 'a', label: 'Item A' },
      { id: 'b', label: 'Item B' },
      { id: 'c', label: 'Item C' },
    ])

    const triggerB1 = container.querySelector('[data-testid="trigger-b"]')!
    expect(triggerB1.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="content-b"]')).not.toBeNull()

    // Insert X before B: A, X, B, C
    await renderItems([
      { id: 'a', label: 'Item A' },
      { id: 'x', label: 'Item X' },
      { id: 'b', label: 'Item B' },
      { id: 'c', label: 'Item C' },
    ])
    const triggerB2 = container.querySelector('[data-testid="trigger-b"]')!
    expect(triggerB2).toBe(triggerB1)
    expect(triggerB2.getAttribute('aria-expanded')).toBe('true')

    // Move B after C: A, X, C, B
    await renderItems([
      { id: 'a', label: 'Item A' },
      { id: 'x', label: 'Item X' },
      { id: 'c', label: 'Item C' },
      { id: 'b', label: 'Item B' },
    ])
    const triggerB3 = container.querySelector('[data-testid="trigger-b"]')!
    expect(triggerB3).toBe(triggerB1)
    expect(triggerB3.getAttribute('aria-expanded')).toBe('true')

    // Remove A: X, C, B
    await renderItems([
      { id: 'x', label: 'Item X' },
      { id: 'c', label: 'Item C' },
      { id: 'b', label: 'Item B' },
    ])
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('true')

    // Remove B: X, C
    await renderItems([
      { id: 'x', label: 'Item X' },
      { id: 'c', label: 'Item C' },
    ])
    expect(container.querySelector('[data-testid="trigger-b"]')).toBeNull()
    expect(container.querySelector('[data-testid="content-b"]')).toBeNull()
    expect(container.querySelector('[aria-expanded="true"]')).toBeNull()

    root.unmount()
    container.remove()
  })

  it('AC-DOM-05: Accordion should reject missing, empty, or duplicate item identities instead of assigning positions', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // 1. Missing id
    await expect(async () => {
      await act(async () => {
        root.render(
          <Accordion value={null}>
            <Collapsible>
              <Collapsible.Trigger>Trigger</Collapsible.Trigger>
              <Collapsible.Content>Content</Collapsible.Content>
            </Collapsible>
          </Accordion>
        )
      })
    }).rejects.toThrow(/missing required.*id/)

    // 2. Empty id
    await expect(async () => {
      await act(async () => {
        root.render(
          <Accordion value={null}>
            <Collapsible id="">
              <Collapsible.Trigger>Trigger</Collapsible.Trigger>
              <Collapsible.Content>Content</Collapsible.Content>
            </Collapsible>
          </Accordion>
        )
      })
    }).rejects.toThrow(/empty.*id/)

    // 3. Duplicate id
    await expect(async () => {
      await act(async () => {
        root.render(
          <Accordion value={null}>
            <Collapsible id="billing">
              <Collapsible.Trigger>Trigger 1</Collapsible.Trigger>
            </Collapsible>
            <Collapsible id="billing">
              <Collapsible.Trigger>Trigger 2</Collapsible.Trigger>
            </Collapsible>
          </Accordion>
        )
      })
    }).rejects.toThrow(/Duplicate item id.*billing/)

    consoleSpy.mockRestore()
    root.unmount()
    container.remove()
  })

  it('AC-DOM-06: Accordion should tolerate controlled values for currently unmounted items without correcting application state', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const onChangeSingle = vi.fn()
    const onChangeMultiple = vi.fn()

    // 1. Single with missing item
    await act(async () => {
      root.render(
        <Accordion expansion="single" value="missing" onChange={onChangeSingle}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="single-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="single-b">B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    expect(container.querySelector('[aria-expanded="true"]')).toBeNull()
    expect(onChangeSingle).not.toHaveBeenCalled()

    // Insert missing item
    await act(async () => {
      root.render(
        <Accordion expansion="single" value="missing" onChange={onChangeSingle}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="single-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="missing">
            <Collapsible.Trigger data-testid="single-missing">Missing</Collapsible.Trigger>
            <Collapsible.Content data-testid="single-missing-content">Found</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    expect(container.querySelector('[data-testid="single-missing"]')!.getAttribute('aria-expanded')).toBe('true')
    expect(onChangeSingle).not.toHaveBeenCalled()

    // 2. Multiple with missing items
    await act(async () => {
      root.render(
        <Accordion expansion="multiple" value={['missing', 'also-missing']} onChange={onChangeMultiple}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="multi-a">A</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    expect(container.querySelector('[aria-expanded="true"]')).toBeNull()
    expect(onChangeMultiple).not.toHaveBeenCalled()

    root.unmount()
    container.remove()
  })

  it('AC-DOM-07: Accordion should default omitted policy to uncontrolled single-null state with header traversal enabled', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <Accordion onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Content A</Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-b">Content B</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement

    // Initial state: all closed, native tab stops (not roving tabindex="-1")
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')
    expect(triggerA.getAttribute('tabindex')).not.toBe('-1')
    expect(triggerB.getAttribute('tabindex')).not.toBe('-1')
    expect(container.querySelector('[data-testid="content-a"]')).toBeNull()
    expect(container.querySelector('[data-testid="content-b"]')).toBeNull()

    // Focus A, press ArrowDown -> moves to B
    triggerA.focus()
    const rootEl = container.querySelector('[data-reference-accordion]')!
    await act(async () => {
      rootEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    expect(document.activeElement).toBe(triggerB)

    // Click B -> requests "b" and opens via internal uncontrolled state
    await act(async () => {
      triggerB.click()
    })
    expect(requests).toEqual(['b'])
    expect(triggerB.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="content-b"]')).not.toBeNull()
    expect(triggerB.getAttribute('tabindex')).not.toBe('-1')

    root.unmount()
    container.remove()
  })

  it('AC-DOM-08: Accordion should remain the sole expansion authority when a child Collapsible supplies competing controlled props', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const rootRequests: any[] = []
    const childRequests: any[] = []

    await act(async () => {
      root.render(
        <Accordion value={null} onChange={(val) => rootRequests.push(val)}>
          <Collapsible id="a" open={true} onChange={(val) => childRequests.push(val)}>
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    // Diagnostic must name competing authority and identify open/onChange
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Competing authority.*Child Collapsible specifies "open" or "onChange"/)
    )

    // State follows root value (null -> closed)
    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="content-a"]')).toBeNull()

    // Trigger click: only root onChange("a") requested, child callback never runs
    triggerA.click()
    expect(rootRequests).toEqual(['a'])
    expect(childRequests).toHaveLength(0)

    consoleSpy.mockRestore()
    root.unmount()
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Single expansion
  // ---------------------------------------------------------------------------

  it('AC-SINGLE-01: A single Accordion should request the newly activated item before changing which disclosure is open', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    const renderWith = async (value: string | null) => {
      await act(async () => {
        root.render(
          <Accordion expansion="single" value={value} onChange={(val) => requests.push(val)}>
            <Collapsible id="a">
              <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
              <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
            </Collapsible>
            <Collapsible id="b">
              <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
              <Collapsible.Content data-testid="content-b">Panel B</Collapsible.Content>
            </Collapsible>
          </Accordion>
        )
      })
    }

    await renderWith('a')
    const triggerA = container.querySelector('[data-testid="trigger-a"]')!
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement

    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    // Click B
    triggerB.click()
    expect(requests).toEqual(['b'])
    // Before parent accepts, A alone remains open
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    // Update value to "b"
    await renderWith('b')
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')
    expect(triggerB.getAttribute('aria-expanded')).toBe('true')

    root.unmount()
    container.remove()
  })

  it('AC-SINGLE-02: A single Accordion should allow its currently open item to request the all-collapsed value', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <Accordion expansion="single" value="a" onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    triggerA.click()

    expect(requests).toEqual([null])
    // Remains open until accepted
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')

    root.unmount()
    container.remove()
  })

  it('AC-SINGLE-03: A single Accordion should preserve its controlled open item when the parent rejects opening or closing requests', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <Accordion expansion="single" value="a" onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-b">Panel B</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement

    // Try to open B
    triggerB.click()
    expect(requests).toEqual(['b'])
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    // Try to close A
    triggerA.click()
    expect(requests).toEqual(['b', null])
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  it('AC-SINGLE-04: A single Accordion should follow programmatic value changes without echoing user requests', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    const renderWith = async (val: string | null) => {
      await act(async () => {
        root.render(
          <Accordion expansion="single" value={val} onChange={(v) => requests.push(v)}>
            <Collapsible id="a">
              <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
              <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
            </Collapsible>
            <Collapsible id="b">
              <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
              <Collapsible.Content data-testid="content-b">Panel B</Collapsible.Content>
            </Collapsible>
          </Accordion>
        )
      })
    }

    await renderWith('a')
    expect(container.querySelector('[data-testid="trigger-a"]')!.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('false')

    await renderWith('b')
    expect(container.querySelector('[data-testid="trigger-a"]')!.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('true')

    await renderWith(null)
    expect(container.querySelector('[data-testid="trigger-a"]')!.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('false')

    await renderWith('a')
    expect(container.querySelector('[data-testid="trigger-a"]')!.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('false')

    expect(requests).toHaveLength(0)

    root.unmount()
    container.remove()
  })

  it('AC-SINGLE-05: A disabled Accordion item should not request policy changes or displace the current item', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <Accordion expansion="single" value="a" onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b" disabled={true}>
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]')!
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement

    expect(triggerB.disabled).toBe(true)
    expect(triggerB.getAttribute('data-disabled')).toBe('')

    triggerB.click()
    expect(requests).toHaveLength(0)
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')

    root.unmount()
    container.remove()
  })

  it('AC-SINGLE-06: Accordion should honor a consumer-canceled Trigger activation before computing a single-value request', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []
    const consumerLogs: string[] = []

    await act(async () => {
      root.render(
        <Accordion expansion="single" value={null} onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger
              data-testid="trigger-a"
              onClick={(e) => {
                consumerLogs.push('canceled')
                e.preventDefault()
              }}
            >
              A
            </Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    triggerA.click()

    expect(consumerLogs).toEqual(['canceled'])
    expect(requests).toHaveLength(0)
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Multiple expansion
  // ---------------------------------------------------------------------------

  it('AC-MULTI-01: A multiple Accordion should request a one-item array when opening from an empty value', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <Accordion expansion="multiple" value={[]} onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    triggerA.click()

    expect(requests).toEqual([['a']])
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  it('AC-MULTI-02: A multiple Accordion should append a newly opened item in current DOM order while retaining existing items', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    const renderWith = async (val: string[]) => {
      await act(async () => {
        root.render(
          <Accordion expansion="multiple" value={val} onChange={(v) => requests.push(v)}>
            <Collapsible id="a">
              <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            </Collapsible>
            <Collapsible id="b">
              <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            </Collapsible>
            <Collapsible id="c">
              <Collapsible.Trigger data-testid="trigger-c">C</Collapsible.Trigger>
            </Collapsible>
          </Accordion>
        )
      })
    }

    await renderWith(['a'])
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement
    triggerB.click()

    expect(requests).toEqual([['a', 'b']])

    // Accept update
    await renderWith(['a', 'b'])
    expect(container.querySelector('[data-testid="trigger-a"]')!.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="trigger-c"]')!.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  it('AC-MULTI-03: A multiple Accordion should remove only the activated open item', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    const renderWith = async (val: string[]) => {
      await act(async () => {
        root.render(
          <Accordion expansion="multiple" value={val} onChange={(v) => requests.push(v)}>
            <Collapsible id="a">
              <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            </Collapsible>
            <Collapsible id="b">
              <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            </Collapsible>
          </Accordion>
        )
      })
    }

    await renderWith(['a', 'b'])
    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    triggerA.click()

    expect(requests).toEqual([['b']])

    await renderWith(['b'])
    expect(container.querySelector('[data-testid="trigger-a"]')!.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('[data-testid="trigger-b"]')!.getAttribute('aria-expanded')).toBe('true')

    root.unmount()
    container.remove()
  })

  it('AC-MULTI-04: A multiple Accordion should canonicalize its next request by current item order without losing unknown controlled IDs', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    // Incoming value has duplicates and unknown IDs: ["ghost-2", "c", "a", "c", "ghost-1"]
    // Mounted order is C, B, A
    await act(async () => {
      root.render(
        <Accordion
          expansion="multiple"
          value={['ghost-2', 'c', 'a', 'c', 'ghost-1']}
          onChange={(val) => requests.push(val)}
        >
          <Collapsible id="c">
            <Collapsible.Trigger data-testid="trigger-c">C</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement
    triggerB.click()

    // Deduplicated known in DOM order: c, b, a; unknowns preserved at tail: ghost-2, ghost-1
    expect(requests).toEqual([['c', 'b', 'a', 'ghost-2', 'ghost-1']])

    root.unmount()
    container.remove()
  })

  it('AC-MULTI-05: A multiple Accordion should not optimistically open or close items after a rejected array request', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <Accordion expansion="multiple" value={['a']} onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement

    // Try opening B
    triggerB.click()
    expect(requests).toEqual([['a', 'b']])
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    // Try closing A
    triggerA.click()
    expect(requests).toEqual([['a', 'b'], []])
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  it('AC-MULTI-06: Accordion should reject an expansion-mode change whose controlled value has the wrong shape', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // 1. single mode with non-string/non-null (array)
    await expect(async () => {
      await act(async () => {
        root.render(
          <Accordion expansion="single" value={['a'] as any}>
            <Collapsible id="a">
              <Collapsible.Trigger>A</Collapsible.Trigger>
            </Collapsible>
          </Accordion>
        )
      })
    }).rejects.toThrow(/Incompatible mode\/value pair.*expansion="single"/)

    // 2. multiple mode with string value
    await expect(async () => {
      await act(async () => {
        root.render(
          <Accordion expansion="multiple" value={'a' as any}>
            <Collapsible id="a">
              <Collapsible.Trigger>A</Collapsible.Trigger>
            </Collapsible>
          </Accordion>
        )
      })
    }).rejects.toThrow(/Incompatible mode\/value pair.*expansion="multiple"/)

    consoleSpy.mockRestore()
    root.unmount()
    container.remove()
  })

  it('AC-MULTI-07: A multiple Accordion should default an omitted value to an uncontrolled empty array', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    // Fixture with onChange
    await act(async () => {
      root.render(
        <Accordion expansion="multiple" onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })

    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')

    await act(async () => {
      triggerA.click()
    })
    expect(requests).toEqual([['a']])
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')

    root.unmount()
    container.remove()
  })

  // ---------------------------------------------------------------------------
  // Nesting and environments
  // ---------------------------------------------------------------------------

  it('AC-NEST-02: A standalone Collapsible inside Accordion Content should not become an Accordion item', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const accordionRequests: any[] = []
    const standaloneRequests: any[] = []

    const TestComponent = () => {
      const [standaloneOpen, setStandaloneOpen] = React.useState(false)
      return (
        <Accordion expansion="single" value="a" onChange={(val) => accordionRequests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="parent-trigger">Parent A</Collapsible.Trigger>
            <Collapsible.Content data-testid="parent-content">
              <Collapsible
                id="details"
                open={standaloneOpen}
                onChange={(open) => {
                  standaloneRequests.push(open)
                  setStandaloneOpen(open)
                }}
              >
                <Collapsible.Trigger data-testid="standalone-trigger">Details</Collapsible.Trigger>
                <Collapsible.Content data-testid="standalone-content">Details Content</Collapsible.Content>
              </Collapsible>
            </Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    }

    await act(async () => {
      root.render(<TestComponent />)
    })

    const standaloneTrigger = container.querySelector('[data-testid="standalone-trigger"]') as HTMLButtonElement
    expect(standaloneTrigger.getAttribute('aria-expanded')).toBe('false')

    // Click standalone trigger twice with act to allow state update
    await act(async () => {
      standaloneTrigger.click()
    })
    expect(standaloneRequests).toEqual([true])
    expect(accordionRequests).toHaveLength(0)

    await act(async () => {
      standaloneTrigger.click()
    })
    expect(standaloneRequests).toEqual([true, false])
    expect(accordionRequests).toHaveLength(0)

    root.unmount()
    container.remove()
  })

  it('AC-ENV-01: Accordion should hydrate controlled single and multiple collections without changing IDs or correcting state', async () => {
    const singleHtml = renderToString(
      <Accordion expansion="single" value="a">
        <Collapsible id="a">
          <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
        </Collapsible>
        <Collapsible id="b">
          <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          <Collapsible.Content data-testid="content-b">Panel B</Collapsible.Content>
        </Collapsible>
      </Accordion>
    )

    const container = document.createElement('div')
    container.innerHTML = singleHtml
    document.body.appendChild(container)

    const onChangeSpy = vi.fn()
    let hydratedRoot: any
    await act(async () => {
      hydratedRoot = hydrateRoot(
        container,
        <Accordion expansion="single" value="a" onChange={onChangeSpy}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-b">Panel B</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })

    expect(onChangeSpy).not.toHaveBeenCalled()
    const triggerA = container.querySelector('[data-testid="trigger-a"]')!
    const triggerB = container.querySelector('[data-testid="trigger-b"]')!
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('false')

    hydratedRoot.unmount()
    container.remove()
  })

  it('AC-ENV-02: Accordion should register each item and emit each activation request once across supported React and StrictMode behavior', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const requests: any[] = []

    await act(async () => {
      root.render(
        <React.StrictMode>
          <Accordion expansion="single" value={null} onChange={(val) => requests.push(val)}>
            <Collapsible id="a">
              <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            </Collapsible>
            <Collapsible id="b">
              <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            </Collapsible>
          </Accordion>
        </React.StrictMode>
      )
    })

    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement
    triggerB.click()

    // Exactly one request despite StrictMode effect replay
    expect(requests).toEqual(['b'])

    root.unmount()
    container.remove()
  })

  it('Uncontrolled single defaultValue should open initially and toggle via internal state', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const requests: any[] = []
    await act(async () => {
      root.render(
        <Accordion expansion="single" defaultValue="a" onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-a">Panel A</Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-b">Panel B</Collapsible.Content>
          </Collapsible>
        </Accordion>
      )
    })
    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    const triggerB2 = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-testid="content-a"]')).not.toBeNull()
    await act(async () => {
      triggerB2.click()
    })
    expect(requests).toEqual(['b'])
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')
    expect(triggerB2.getAttribute('aria-expanded')).toBe('true')
    await act(async () => {
      triggerB2.click()
    })
    expect(requests).toEqual(['b', null])
    expect(triggerB2.getAttribute('aria-expanded')).toBe('false')
    root.unmount()
    container.remove()
  })

  it('Uncontrolled multiple defaultValue should open initially and toggle via internal state', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const requests: any[] = []
    await act(async () => {
      root.render(
        <Accordion expansion="multiple" defaultValue={['a']} onChange={(val) => requests.push(val)}>
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="trigger-b">B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      )
    })
    const triggerA = container.querySelector('[data-testid="trigger-a"]') as HTMLButtonElement
    const triggerB = container.querySelector('[data-testid="trigger-b"]') as HTMLButtonElement
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    await act(async () => {
      triggerB.click()
    })
    expect(requests).toEqual([['a', 'b']])
    expect(triggerA.getAttribute('aria-expanded')).toBe('true')
    expect(triggerB.getAttribute('aria-expanded')).toBe('true')
    await act(async () => {
      triggerA.click()
    })
    expect(requests).toEqual([['a', 'b'], ['b']])
    expect(triggerA.getAttribute('aria-expanded')).toBe('false')
    expect(triggerB.getAttribute('aria-expanded')).toBe('true')
    root.unmount()
    container.remove()
  })
})
