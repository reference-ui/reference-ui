// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Menu } from '../Menu'
import { Menubar } from './Menubar'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Menubar is controlled-only: every interactive test drives it through this
// stateful harness (value + onChange), recording emissions into `seen`.
const ControlledMenubar = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode
    initialValue?: string | null
    seen?: (string | null)[]
    control?: { setValue: (v: string | null) => void }
  }
>(function ControlledMenubar({ children, initialValue = null, seen, control }, ref) {
  const [value, setValue] = React.useState<string | null>(initialValue)
  if (control) control.setValue = setValue
  return (
    <Menubar
      ref={ref}
      value={value}
      onChange={next => {
        seen?.push(next)
        setValue(next)
      }}
    >
      {children}
    </Menubar>
  )
})

describe('Menubar value coordination', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'menubar-test-root'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    for (const child of Array.from(document.body.children)) {
      if (child.id !== 'menubar-test-root') {
        child.remove()
      }
    }
  })

  it('renders a menubar row of menuitem triggers with one tab stop', async () => {
    await React.act(async () => {
      root.render(
        <ControlledMenubar>
          <Menubar.Menu value="file">
            <Menubar.Trigger id="mb-trigger-file">File</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger id="mb-trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </ControlledMenubar>
      )
    })

    const bar = container.querySelector('[role="menubar"]')
    expect(bar).not.toBeNull()
    const file = document.getElementById('mb-trigger-file')!
    const edit = document.getElementById('mb-trigger-edit')!
    expect(file.tagName).toBe('BUTTON')
    expect(file.getAttribute('role')).toBe('menuitem')
    expect(file.getAttribute('aria-haspopup')).toBe('menu')
    expect(file.getAttribute('aria-expanded')).toBe('false')
    expect(file.getAttribute('data-state')).toBe('closed')
    expect(file.getAttribute('tabindex')).toBe('0')
    expect(edit.getAttribute('tabindex')).toBe('-1')
    expect(document.getElementById('mb-file-new')).toBeNull()
  })

  it('opens one menu per click and closes the others', async () => {
    const seen: (string | null)[] = []
    await React.act(async () => {
      root.render(
        <ControlledMenubar seen={seen}>
          <Menubar.Menu value="file">
            <Menubar.Trigger id="mb-trigger-file">File</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger id="mb-trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </ControlledMenubar>
      )
    })

    const file = document.getElementById('mb-trigger-file')!
    const edit = document.getElementById('mb-trigger-edit')!

    await React.act(async () => {
      file.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(document.getElementById('mb-file-new')).not.toBeNull()
    expect(document.getElementById('mb-edit-undo')).toBeNull()
    expect(file.getAttribute('aria-expanded')).toBe('true')

    await React.act(async () => {
      edit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(document.getElementById('mb-file-new')).toBeNull()
    expect(document.getElementById('mb-edit-undo')).not.toBeNull()
    expect(file.getAttribute('aria-expanded')).toBe('false')
    expect(edit.getAttribute('aria-expanded')).toBe('true')

    expect(seen).toEqual(['file', 'edit'])
  })

  it('MB-OPEN-04: never emits redundant identical values', async () => {
    const seen: (string | null)[] = []
    await React.act(async () => {
      root.render(
        <ControlledMenubar seen={seen}>
          <Menubar.Menu value="file">
            <Menubar.Trigger id="mb-trigger-file">File</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger id="mb-trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </ControlledMenubar>
      )
    })

    const file = document.getElementById('mb-trigger-file')!
    const edit = document.getElementById('mb-trigger-edit')!

    await React.act(async () => {
      file.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await React.act(async () => {
      file.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await React.act(async () => {
      edit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(seen).toEqual(['file', null, 'edit'])
  })

  it('MB-OPEN-04: drops a controlled same-value request without emitting', async () => {
    const seen: (string | null)[] = []
    await React.act(async () => {
      root.render(
        <Menubar value="file" onChange={next => seen.push(next)}>
          <Menubar.Menu value="file">
            <Menubar.Trigger id="mb-trigger-file">File</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      )
    })

    // File is open; Enter on its own trigger re-requests the held value.
    const file = document.getElementById('mb-trigger-file')!
    file.focus()
    await React.act(async () => {
      file.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(document.getElementById('mb-file-new')).not.toBeNull()
    expect(seen).toEqual([])
  })

  it('MB-DOM-03: forwards refs to the documented hosts', async () => {
    const rootRef = React.createRef<HTMLDivElement>()
    const triggerRef = React.createRef<HTMLButtonElement>()
    const contentRef = React.createRef<HTMLDivElement>()
    await React.act(async () => {
      root.render(
        <ControlledMenubar ref={rootRef} initialValue="file">
          <Menubar.Menu value="file">
            <Menubar.Trigger ref={triggerRef}>File</Menubar.Trigger>
            <Menubar.Content ref={contentRef}>
              <Menu.Item>New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </ControlledMenubar>
      )
    })

    expect(rootRef.current?.tagName).toBe('DIV')
    expect(rootRef.current?.getAttribute('role')).toBe('menubar')
    expect(triggerRef.current?.tagName).toBe('BUTTON')
    expect(contentRef.current?.tagName).toBe('DIV')
    expect(contentRef.current?.querySelector('[role="menu"]')).not.toBeNull()
  })

  it('MB-DOM-04: dev-warns on duplicate menu values', async () => {
    const errors: string[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    }
    try {
      await React.act(async () => {
        root.render(
          <ControlledMenubar>
            <Menubar.Menu value="file">
              <Menubar.Trigger id="mb-trigger-file-a">File A</Menubar.Trigger>
              <Menubar.Content>
                <Menu.Item>New A</Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
            <Menubar.Menu value="file">
              <Menubar.Trigger id="mb-trigger-file-b">File B</Menubar.Trigger>
              <Menubar.Content>
                <Menu.Item>New B</Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </ControlledMenubar>
        )
      })
      expect(errors.join('\n')).toMatch(/duplicate menu value "file"/)
    } finally {
      console.error = origError
    }
  })

  it('MB-DOM-05: defaults omitted menu values to stable generated ids', async () => {
    const errors: string[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    }
    try {
      const tree = (
        <ControlledMenubar>
          <Menubar.Menu>
            <Menubar.Trigger id="mb-trigger-a">Alpha</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-item-a">Item A</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu>
            <Menubar.Trigger id="mb-trigger-b">Beta</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="mb-item-b">Item B</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </ControlledMenubar>
      )
      await React.act(async () => {
        root.render(tree)
      })

      const triggerA = document.getElementById('mb-trigger-a')!
      const triggerB = document.getElementById('mb-trigger-b')!
      await React.act(async () => {
        triggerA.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      expect(document.getElementById('mb-item-a')).not.toBeNull()
      expect(document.getElementById('mb-item-b')).toBeNull()

      // Rerender: generated values stay stable, so switching still works and
      // no duplicate warning fires.
      await React.act(async () => {
        root.render(tree)
      })
      await React.act(async () => {
        triggerB.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      expect(document.getElementById('mb-item-a')).toBeNull()
      expect(document.getElementById('mb-item-b')).not.toBeNull()
      expect(errors.join('\n')).not.toMatch(/duplicate menu value/)
    } finally {
      console.error = origError
    }
  })

  it('MB-ENV-01: SSRs closed triggers and hydrates into a working bar', async () => {
    const errors: string[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    }
    try {
      const tree = (
        <ControlledMenubar>
          <Menubar.Menu value="file">
            <Menubar.Trigger id="ssr-trigger-file">File</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="ssr-file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger id="ssr-trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content>
              <Menu.Item id="ssr-edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </ControlledMenubar>
      )
      const html = renderToString(tree)

      expect(html).toContain('role="menubar"')
      expect(html).toContain('ssr-trigger-file')
      expect(html).toContain('ssr-trigger-edit')
      expect(html).toContain('aria-haspopup="menu"')
      expect(html).not.toContain('ssr-file-new')
      expect(html).not.toContain('ssr-edit-undo')

      const host = document.createElement('div')
      host.innerHTML = html
      document.body.appendChild(host)

      const hydrated = hydrateRoot(host, tree)
      await React.act(async () => {})

      const trigger = document.getElementById('ssr-trigger-file')!
      await React.act(async () => {
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(document.getElementById('ssr-file-new')).not.toBeNull()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      const controls = trigger.getAttribute('aria-controls')
      expect(controls).toBeTruthy()
      const controlled = document.getElementById(controls!)
      expect(controlled).not.toBeNull()
      expect(controlled!.querySelector('[role="menu"]')).not.toBeNull()

      await React.act(async () => {
        hydrated.unmount()
      })
      host.remove()
      expect(errors.join('\n')).not.toMatch(/hydrat/i)
    } finally {
      console.error = origError
    }
  })

  it('MB-ENV-02: keeps one action and one value request across StrictMode replay', async () => {
    const selectSpy = vi.fn()
    const seen: (string | null)[] = []

    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <ControlledMenubar seen={seen}>
            <Menubar.Menu value="file">
              <Menubar.Trigger id="strict-trigger-file">File</Menubar.Trigger>
              <Menubar.Content>
                <Menu.Item id="strict-file-new" onSelect={selectSpy}>
                  New
                </Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </ControlledMenubar>
        </React.StrictMode>
      )
    })

    const trigger = document.getElementById('strict-trigger-file')!
    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const item = document.getElementById('strict-file-new')!
    await React.act(async () => {
      item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(selectSpy).toHaveBeenCalledTimes(1)
    expect(seen).toEqual(['file', null])
  })
})

// Red-team Hunt 1 fortify pins: a no-op entry key (Up/Down/Enter/Space) on an
// already-open trigger must plant no entry intent, so the next unrelated
// open (switch or programmatic) lands container-or-first per SPEC MB-KEY-03.
describe('Menubar stale entry intent pins', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'menubar-test-root'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    for (const child of Array.from(document.body.children)) {
      if (child.id !== 'menubar-test-root') {
        child.remove()
      }
    }
  })

  function Bar({ seen, control }: { seen?: (string | null)[]; control?: { setValue: (v: string | null) => void } }) {
    return (
      <ControlledMenubar seen={seen} control={control}>
        <Menubar.Menu value="file">
          <Menubar.Trigger id="mb-pin-trigger-file">File</Menubar.Trigger>
          <Menubar.Content>
            <Menu.Item id="mb-pin-file-new">New</Menu.Item>
            <Menu.Item id="mb-pin-file-open">Open</Menu.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger id="mb-pin-trigger-edit">Edit</Menubar.Trigger>
          <Menubar.Content>
            <Menu.Item id="mb-pin-edit-undo">Undo</Menu.Item>
            <Menu.Item id="mb-pin-edit-redo">Redo</Menu.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </ControlledMenubar>
    )
  }

  /** Menu entry focus runs in requestAnimationFrame; flush it inside act. */
  async function flushEntryFocus(rounds = 3) {
    await React.act(async () => {
      for (let i = 0; i < rounds; i++) {
        await new Promise<void>(resolve => {
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve())
          } else {
            setTimeout(() => resolve(), 16)
          }
        })
      }
    })
  }

  function pressKey(el: HTMLElement, key: string) {
    return React.act(async () => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    })
  }

  function activeId(): string | null {
    const el = document.activeElement as HTMLElement | null
    return el ? el.id || null : null
  }

  /** SPEC landing set for a fresh switch: the new menu's container or first item. */
  function landedFirstOrContainer(): boolean {
    const el = document.activeElement as HTMLElement | null
    if (!el) return false
    if (el.id === 'mb-pin-edit-undo') return true
    return el.hasAttribute('data-reference-menu-content')
  }

  it('P1: trigger-arrow switch after Up-on-open-trigger lands container-or-first', async () => {
    const seen: (string | null)[] = []
    await React.act(async () => {
      root.render(<Bar seen={seen} />)
    })
    const file = document.getElementById('mb-pin-trigger-file')!

    await React.act(async () => {
      file.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await flushEntryFocus()
    expect(document.getElementById('mb-pin-file-new')).not.toBeNull()

    file.focus()

    // Up on an ALREADY-OPEN menu: a non-opening key. Nothing may open or emit.
    await pressKey(file, 'ArrowUp')
    await flushEntryFocus()
    expect(seen).toEqual(['file'])
    expect(document.getElementById('mb-pin-file-new')).not.toBeNull()

    await pressKey(file, 'ArrowRight')
    await flushEntryFocus()
    expect(document.getElementById('mb-pin-file-new')).toBeNull()
    expect(document.getElementById('mb-pin-edit-undo')).not.toBeNull()
    expect(seen).toEqual(['file', 'edit'])

    expect(
      landedFirstOrContainer(),
      `switch landed on #${activeId()}; SPEC pins container-or-first (mb-pin-edit-undo)`
    ).toBe(true)
  })

  it('P2: content-arrow switch after Up-on-open-trigger lands container-or-first', async () => {
    await React.act(async () => {
      root.render(<Bar />)
    })
    const file = document.getElementById('mb-pin-trigger-file')!

    await React.act(async () => {
      file.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await flushEntryFocus()

    file.focus()
    await pressKey(file, 'ArrowUp')
    const fileNew = document.getElementById('mb-pin-file-new')!
    fileNew.focus()
    await pressKey(fileNew, 'ArrowRight')
    await flushEntryFocus()

    expect(document.getElementById('mb-pin-edit-undo')).not.toBeNull()
    expect(
      landedFirstOrContainer(),
      `content switch landed on #${activeId()}; SPEC pins container-or-first (mb-pin-edit-undo)`
    ).toBe(true)
  })

  it('P3: programmatic open after Up-on-open-trigger lands container-or-first', async () => {
    const control = { setValue: (_v: string | null) => {} }
    await React.act(async () => {
      root.render(<Bar control={control} />)
    })
    const file = document.getElementById('mb-pin-trigger-file')!

    await React.act(async () => {
      file.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await flushEntryFocus()

    file.focus()
    await pressKey(file, 'ArrowUp')

    // No gesture at all: the parent opens Edit on its own.
    await React.act(async () => {
      control.setValue('edit')
    })
    await flushEntryFocus()

    expect(document.getElementById('mb-pin-edit-undo')).not.toBeNull()
    expect(
      landedFirstOrContainer(),
      `programmatic open landed on #${activeId()}; SPEC pins container-or-first (mb-pin-edit-undo)`
    ).toBe(true)
  })
})
