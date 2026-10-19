// @vitest-environment happy-dom
/** Unit proofs for Tree: deterministic deduplicated expansion emission
 * in traversal order (TR-EXPAND-06), hydration and StrictMode
 * registration (TR-ENV-01/02), fail-fast on omitted value — fully
 * controlled, null is empty (TR-API-01) — and batch sibling emission
 * in document order. */
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComboboxContext, type ComboboxContextValue } from '../Combobox/combobox-context'
import { Tree, getBatchExpanded, getDeterministicExpanded } from './Tree'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Tree Unit Proofs', () => {
  it('TR-EXPAND-06: Tree should emit deterministic deduplicated expanded arrays in current traversal order', () => {
    const allKnownBranches = ['a', 'b', 'c']
    const incoming = ['unknown-2', 'c', 'a', 'c', 'unknown-1']

    // Expand 'b'
    const resultExpand = getDeterministicExpanded(incoming, 'b', allKnownBranches, true)
    expect(resultExpand).toEqual(['a', 'b', 'c', 'unknown-2', 'unknown-1'])

    // Collapse 'c'
    const resultCollapse = getDeterministicExpanded(resultExpand, 'c', allKnownBranches, false)
    expect(resultCollapse).toEqual(['a', 'b', 'unknown-2', 'unknown-1'])
  })

  it('TR-ENV-01: Tree should hydrate nested hierarchy and generated relationships without mismatch', () => {
    const html = renderToString(
      <Tree value="src/index" onChange={() => {}} expanded={['src']}>
        <Tree.Item value="src">
          <Tree.Expander aria-label="Toggle src" />
          <span>src</span>
          <Tree.Group>
            <Tree.Item value="src/index">index.ts</Tree.Item>
            <Tree.Item value="src/tree">tree.ts</Tree.Item>
          </Tree.Group>
        </Tree.Item>
        <Tree.Item value="readme">README.md</Tree.Item>
      </Tree>
    )

    expect(html).toContain('role="tree"')
    expect(html).toContain('role="treeitem"')
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-controls=')
    expect(html).toContain('aria-level="1"')
    expect(html).toContain('aria-level="2"')
  })

  it('TR-ENV-02: Tree should register and invoke once across React versions and StrictMode', () => {
    const onChange = vi.fn()
    const onExpandedChange = vi.fn()

    const html = renderToString(
      <React.StrictMode>
        <Tree
          value="a"
          onChange={onChange}
          expanded={['branch-1']}
          onExpandedChange={onExpandedChange}
        >
          <Tree.Item value="branch-1">
            <Tree.Expander />
            <span>Branch</span>
            <Tree.Group>
              <Tree.Item value="a">A</Tree.Item>
            </Tree.Group>
          </Tree.Item>
        </Tree>
      </React.StrictMode>
    )

    expect(html).toContain('role="tree"')
    expect(onChange).not.toHaveBeenCalled()
    expect(onExpandedChange).not.toHaveBeenCalled()
  })

  it('TR-API-01: Tree should fail fast when value is omitted (fully controlled, null is empty)', () => {
    expect(() =>
      renderToString(
        <Tree value={undefined as unknown as string | null} onChange={() => {}}>
          <Tree.Item value="a">A</Tree.Item>
        </Tree>
      )
    ).toThrow('Tree "value" is required')
  })

  it('getBatchExpanded should fold deterministic emission over a sibling set in document order', () => {
    const allKnownBranches = ['a', 'b', 'c']

    // Request order does not leak into the payload: document order wins
    expect(getBatchExpanded(['a'], ['c', 'b'], allKnownBranches)).toEqual(['a', 'b', 'c'])

    // Already-expanded ids are skipped; unknown values keep trailing order
    expect(getBatchExpanded(['unknown-1', 'a'], ['a', 'b'], allKnownBranches)).toEqual([
      'a',
      'b',
      'unknown-1',
    ])
  })

  it('getBatchExpanded should be a stable no-op for an empty sibling set', () => {
    const current = ['a']
    expect(getBatchExpanded(current, [], ['a', 'b'])).toBe(current)
  })

  it('TR-API-02: Tree should fail fast when onChange is omitted (no silent-frozen controlled)', () => {
    expect(() =>
      renderToString(
        <Tree
          value={null}
          onChange={undefined as unknown as (value: string | null) => void}
        >
          <Tree.Item value="a">A</Tree.Item>
        </Tree>
      )
    ).toThrow('Tree "onChange" is required')
  })
})

describe('Tree out-of-range proofs (dev warning on unmatched value and expanded ids)', () => {
  let container: HTMLDivElement
  let root: Root
  let errors: Array<Array<unknown>>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    errors = []
    errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: Array<unknown>) => {
      errors.push(args)
    })
  })

  afterEach(async () => {
    errorSpy.mockRestore()
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  // Tree's warnings arrive as one console.error string with the Tree prefix.
  function treeWarnings(): string[] {
    return errors
      .map((args) => args.join(' '))
      .filter((text) => text.startsWith('[reference-ui] Tree: '))
  }

  // The warning waits for the registry to settle (a quiet window in the hook),
  // so every warning assertion first lets that window close.
  async function settle() {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80))
    })
  }

  // One branch, fully expandable: folder contains a and b.
  function FolderTree({
    value,
    expanded,
    onExpandedChange,
  }: {
    value: string | null
    expanded: string[]
    onExpandedChange?: (next: string[]) => void
  }) {
    return (
      <Tree
        value={value}
        onChange={() => {}}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      >
        <Tree.Item value="folder">
          <Tree.Expander />
          <span>Folder</span>
          <Tree.Group>
            <Tree.Item value="a">A</Tree.Item>
            <Tree.Item value="b">B</Tree.Item>
          </Tree.Group>
        </Tree.Item>
      </Tree>
    )
  }

  // Two branches: 'open' keeps its child mounted when expanded, while
  // 'closed' unmounts its child 'deep' whenever it is collapsed.
  function TwoBranchTree({ value, expanded }: { value: string | null; expanded: string[] }) {
    return (
      <Tree value={value} onChange={() => {}} expanded={expanded}>
        <Tree.Item value="open">
          <Tree.Expander />
          <span>Open</span>
          <Tree.Group>
            <Tree.Item value="open-child">Open child</Tree.Item>
          </Tree.Group>
        </Tree.Item>
        <Tree.Item value="closed">
          <Tree.Expander />
          <span>Closed</span>
          <Tree.Group>
            <Tree.Item value="deep">Deep</Tree.Item>
          </Tree.Group>
        </Tree.Item>
      </Tree>
    )
  }

  // Minimal Combobox stand-in: only the members Tree reads when nested.
  const stubCombobox = {
    value: null,
    registerOption: () => () => {},
    activeOptionId: null,
    activeValue: null,
    setActiveValue: () => {},
    handleSelect: () => {},
    treeExpansionRequest: null,
  } as unknown as ComboboxContextValue

  function NestedFolderTree({ expanded }: { expanded: string[] }) {
    return (
      <ComboboxContext.Provider value={stubCombobox}>
        <Tree value="ghost" expanded={expanded}>
          <Tree.Item value="folder">
            <Tree.Expander />
            <span>Folder</span>
            <Tree.Group>
              <Tree.Item value="a">A</Tree.Item>
              <Tree.Item value="b">B</Tree.Item>
            </Tree.Group>
          </Tree.Item>
        </Tree>
      </ComboboxContext.Provider>
    )
  }

  it('OOR-TREE-01: warns with the exact text when a fully expanded tree value matches no item', async () => {
    await React.act(async () => {
      root.render(<FolderTree value="ghost" expanded={['folder']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: value "ghost" matches no item (registered ids: folder, a, b).',
    ])
  })

  it('OOR-TREE-02: warns with the exact text for an unknown expanded id and still passes it through', async () => {
    const onExpandedChange = vi.fn()
    await React.act(async () => {
      root.render(
        <FolderTree value={null} expanded={['folder', 'ghost']} onExpandedChange={onExpandedChange} />
      )
    })
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: expanded contains "ghost" matching no item (registered ids: folder, a, b); unknown ids are kept and passed through.',
    ])
    // Passthrough: collapsing the branch emits the unknown id unchanged.
    await React.act(async () => {
      container.querySelector<HTMLButtonElement>('button')?.click()
    })
    expect(onExpandedChange).toHaveBeenLastCalledWith(['ghost'])
  })

  it('OOR-TREE-03: stays silent for a valid selected id that lives under a collapsed branch', async () => {
    await React.act(async () => {
      root.render(<TwoBranchTree value="deep" expanded={['open']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([])
  })

  it('OOR-TREE-04: known limit, stays silent while any branch is collapsed, even for a truly unknown value or expanded id', async () => {
    await React.act(async () => {
      root.render(<TwoBranchTree value="typo" expanded={['open', 'ghost']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([])
  })

  it('OOR-TREE-05: stays silent on a normal mount with valid ids', async () => {
    await React.act(async () => {
      root.render(<TwoBranchTree value="deep" expanded={['open', 'closed']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([])
  })

  it('OOR-TREE-06: never warns for a null value on a fully expanded tree', async () => {
    await React.act(async () => {
      root.render(<FolderTree value={null} expanded={['folder']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([])
  })

  it('OOR-TREE-07: stays silent under StrictMode for a valid mount', async () => {
    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <FolderTree value="a" expanded={['folder']} />
        </React.StrictMode>
      )
    })
    await settle()
    expect(treeWarnings()).toEqual([])
  })

  it('OOR-TREE-08: warns exactly once under StrictMode for an unmatched value', async () => {
    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <FolderTree value="ghost" expanded={['folder']} />
        </React.StrictMode>
      )
    })
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: value "ghost" matches no item (registered ids: folder, a, b).',
    ])
  })

  it('OOR-TREE-09: equal re-renders never repeat a warning, and a new unknown id names only itself', async () => {
    // Each render settles first: back-to-back renders are one registry change
    // and would be named together in one warning.
    await React.act(async () => {
      root.render(<FolderTree value={null} expanded={['folder', 'ghost']} />)
    })
    await settle()
    await React.act(async () => {
      root.render(<FolderTree value={null} expanded={['folder', 'ghost']} />)
    })
    await settle()
    await React.act(async () => {
      root.render(<FolderTree value={null} expanded={['folder', 'ghost', 'phantom']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: expanded contains "ghost" matching no item (registered ids: folder, a, b); unknown ids are kept and passed through.',
      '[reference-ui] Tree: expanded contains "phantom" matching no item (registered ids: folder, a, b); unknown ids are kept and passed through.',
    ])
  })

  it('OOR-TREE-10: nested in Combobox the value check is skipped, while unknown expanded ids are still reported', async () => {
    await React.act(async () => {
      root.render(<NestedFolderTree expanded={['folder']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([])
    await React.act(async () => {
      root.render(<NestedFolderTree expanded={['folder', 'phantom']} />)
    })
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: expanded contains "phantom" matching no item (registered ids: folder, a, b); unknown ids are kept and passed through.',
    ])
  })

  it('OOR-TREE-11: a registration made by a child with its own state re-runs the check through the registry version', async () => {
    function LateItem() {
      const [ready, setReady] = React.useState(false)
      React.useEffect(() => {
        setReady(true)
      }, [])
      return ready ? <Tree.Item value="late">Late</Tree.Item> : null
    }
    // Mount with an empty registry: nothing to decide yet. The item then
    // registers without the root re-rendering, so only the version bump can
    // make the check run again.
    await React.act(async () => {
      root.render(
        <Tree value="typo" onChange={() => {}}>
          <LateItem />
        </Tree>
      )
    })
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: value "typo" matches no item (registered ids: late).',
    ])
  })

  it('OOR-TREE-12: a child that registers on the next commit under an expanded branch cancels the pending warning', async () => {
    function LateChild() {
      const [ready, setReady] = React.useState(false)
      React.useEffect(() => {
        setReady(true)
      }, [])
      return ready ? <Tree.Item value="late">Late</Tree.Item> : null
    }
    // The first commit already has a pending decision: the branch is expanded
    // and "late" is absent. Its registration on the next commit must cancel it.
    await React.act(async () => {
      root.render(
        <Tree value="late" onChange={() => {}} expanded={['folder']}>
          <Tree.Item value="folder">
            <Tree.Expander />
            <span>Folder</span>
            <Tree.Group>
              <Tree.Item value="a">A</Tree.Item>
              <LateChild />
            </Tree.Group>
          </Tree.Item>
        </Tree>
      )
    })
    await settle()
    expect(treeWarnings()).toEqual([])
  })

  it('OOR-TREE-13: a child that registers after a 30ms timer under an expanded branch cancels the pending warning', () => {
    function AsyncChild() {
      const [ready, setReady] = React.useState(false)
      React.useEffect(() => {
        const timer = setTimeout(() => setReady(true), 30)
        return () => clearTimeout(timer)
      }, [])
      return ready ? <Tree.Item value="async">Async</Tree.Item> : null
    }
    // Fake timers with synchronous act: a timer's state update inside an async
    // act is held in act's queue until the act ends, so the child could not
    // register inside the window. Each step flushes its own work at once.
    vi.useFakeTimers()
    try {
      React.act(() => {
        root.render(
          <Tree value="async" onChange={() => {}} expanded={['folder']}>
            <Tree.Item value="folder">
              <Tree.Expander />
              <span>Folder</span>
              <Tree.Group>
                <Tree.Item value="a">A</Tree.Item>
                <AsyncChild />
              </Tree.Group>
            </Tree.Item>
          </Tree>
        )
      })
      React.act(() => {
        vi.advanceTimersByTime(30)
      })
      React.act(() => {
        vi.advanceTimersByTime(120)
      })
      expect(treeWarnings()).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })

  it('OOR-TREE-14: a truly unknown value warns exactly once, and only after the settle window', async () => {
    await React.act(async () => {
      root.render(<FolderTree value="ghost" expanded={['folder']} />)
    })
    expect(treeWarnings()).toEqual([])
    await settle()
    expect(treeWarnings()).toEqual([
      '[reference-ui] Tree: value "ghost" matches no item (registered ids: folder, a, b).',
    ])
  })
})
