import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Tree } from './index'
import { Combobox } from '../Combobox'
import { Field } from '../Field'
import { useOverlayStore } from '../Overlay/stack'

export const Basic = () => {
  const [value, setValue] = React.useState<string | null>('doc-1')
  const [expanded, setExpanded] = React.useState<string[]>(['folder-1'])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="80r">
        <Div
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          p="2r"
          mb="4r"
        >
          <Tree
            data-testid="test-tree"
            value={value}
            onChange={setValue}
            expanded={expanded}
            onExpandedChange={setExpanded}
          >
            <Tree.Item id="folder-1" isBranch data-testid="tree-item-folder-1">
              <Div display="flex" alignItems="center" gap="1.5r">
                <Tree.Expander itemId="folder-1" data-testid="expander-folder-1" />
                <Span fontWeight="600">📁 Documents</Span>
              </Div>
              <Tree.Group data-testid="tree-group-folder-1">
                <Tree.Item id="doc-1" data-testid="tree-item-doc-1">
                  <Span>📄 Resume.pdf</Span>
                </Tree.Item>
                <Tree.Item id="doc-2" data-testid="tree-item-doc-2">
                  <Span>📄 Budget.xlsx</Span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item id="file-readme" data-testid="tree-item-readme">
              <Span>📄 README.md</Span>
            </Tree.Item>
          </Tree>
        </Div>

        <Span data-testid="tree-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Parity = () => {
  // Main Tree state (mirrors the quarantine matrix fixture testids)
  const [value, setValue] = React.useState<string | null>('doc-1')
  const [expanded, setExpanded] = React.useState<string[]>(['folder-1'])

  // Rejection tests: when reject is true, callbacks log but state is not updated
  const [rejectSelection, setRejectSelection] = React.useState(false)
  const [rejectExpansion, setRejectExpansion] = React.useState(false)
  const [selectionLog, setSelectionLog] = React.useState<string[]>([])
  const [expansionLog, setExpansionLog] = React.useState<string[][]>([])

  // Dynamic tree state
  const [showDoc1, setShowDoc1] = React.useState(true)
  const [showDoc2, setShowDoc2] = React.useState(true)
  const [showOverride, setShowOverride] = React.useState(true)
  const [showMainItems, setShowMainItems] = React.useState(true)
  const [alphaIsBranch, setAlphaIsBranch] = React.useState(false)
  const [ancestorDisabled, setAncestorDisabled] = React.useState(false)
  const [childDisabled, setChildDisabled] = React.useState(false)

  // Duplicate error state
  const [showDuplicate, setShowDuplicate] = React.useState(false)

  // RTL toggle
  const [isRtl, setIsRtl] = React.useState(false)

  // Key cancellation log
  const [keyLog, setKeyLog] = React.useState<string[]>([])

  // Typeahead dynamic label & textValue state
  const [typeaheadLabel, setTypeaheadLabel] = React.useState('Zulu')
  const [typeaheadTextValue, setTypeaheadTextValue] = React.useState<string | undefined>(undefined)

  // Auxiliary fixture trees: selection is state-controlled everywhere
  // (expansion stays default/uncontrolled unless the section drives it).
  const [emptyValue, setEmptyValue] = React.useState<string | null>(null)
  const [omittedValue, setOmittedValue] = React.useState<string | null>(null)
  const [reorderValue, setReorderValue] = React.useState<string | null>(null)
  const [detValue, setDetValue] = React.useState<string | null>(null)
  const [refsValue, setRefsValue] = React.useState<string | null>(null)

  // Deterministic-order section state (TR-EXPAND-06)
  const [detExpanded, setDetExpanded] = React.useState<string[]>([
    'unknown-2',
    'c',
    'a',
    'c',
    'unknown-1',
  ])
  const [detLog, setDetLog] = React.useState<string[][]>([])

  // Ref forwarding probes (TR-DOM-07)
  const refsRootRef = React.useRef<HTMLDivElement>(null)
  const refsItemRef = React.useRef<HTMLDivElement>(null)
  const refsGroupTag = React.useRef<string | null>(null)
  const refsExpanderRef = React.useRef<HTMLButtonElement>(null)
  const [refsTags, setRefsTags] = React.useState('')

  React.useEffect(() => {
    setRefsTags(
      [
        refsRootRef.current?.tagName,
        refsItemRef.current?.tagName,
        refsGroupTag.current,
        refsExpanderRef.current?.tagName,
      ].join(',')
    )
  }, [])

  const handleTreeChange = (next: string | null) => {
    setSelectionLog((prev) => [...prev, String(next)])
    if (!rejectSelection) {
      setValue(next)
    }
  }

  const handleTreeExpandedChange = (next: string[]) => {
    setExpansionLog((prev) => [...prev, next])
    if (!rejectExpansion) {
      setExpanded(next)
    }
  }

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="120r">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button type="button" data-testid="toggle-reject-select" onClick={() => setRejectSelection((p) => !p)}>
            Toggle Reject Select ({rejectSelection ? 'ON' : 'OFF'})
          </button>
          <button type="button" data-testid="toggle-reject-expand" onClick={() => setRejectExpansion((p) => !p)}>
            Toggle Reject Expand ({rejectExpansion ? 'ON' : 'OFF'})
          </button>
          <button type="button" data-testid="set-value-charlie" onClick={() => setValue('charlie')}>
            Programmatic Select Charlie
          </button>
          <button
            type="button"
            data-testid="set-expanded-multi"
            onClick={() => setExpanded(['folder-1', 'subfolder-1', 'disabled-branch'])}
          >
            Expand Multi
          </button>
          <button type="button" data-testid="set-expanded-none" onClick={() => setExpanded([])}>
            Collapse All
          </button>
          <button type="button" data-testid="remove-doc-1" onClick={() => setShowDoc1(false)}>
            Remove doc-1
          </button>
          <button type="button" data-testid="remove-doc-2" onClick={() => setShowDoc2(false)}>
            Remove doc-2
          </button>
          <button type="button" data-testid="remove-override" onClick={() => setShowOverride(false)}>
            Remove override
          </button>
          <button type="button" data-testid="clear-main-items" onClick={() => setShowMainItems(false)}>
            Clear main items
          </button>
          <button type="button" data-testid="toggle-alpha-branch" onClick={() => setAlphaIsBranch((p) => !p)}>
            Toggle Alpha Branch/Leaf
          </button>
          <button type="button" data-testid="toggle-ancestor-disabled" onClick={() => setAncestorDisabled((p) => !p)}>
            Toggle Ancestor Disabled
          </button>
          <button type="button" data-testid="toggle-child-disabled" onClick={() => setChildDisabled((p) => !p)}>
            Toggle Child Disabled
          </button>
          <button type="button" data-testid="toggle-duplicate" onClick={() => setShowDuplicate((p) => !p)}>
            Trigger Duplicate
          </button>
          <button type="button" data-testid="toggle-rtl" onClick={() => setIsRtl((p) => !p)}>
            Toggle RTL ({isRtl ? 'RTL' : 'LTR'})
          </button>
          <button type="button" data-testid="set-label-rainbow" onClick={() => setTypeaheadLabel('Rainbow')}>
            Set label Rainbow
          </button>
          <button type="button" data-testid="set-textvalue-bravo" onClick={() => setTypeaheadTextValue('Bravo')}>
            Set textValue Bravo
          </button>
        </div>

        <section style={{ margin: '16px 0' }} dir={isRtl ? 'rtl' : 'ltr'}>
          <h2>Primary Tree</h2>
          <div style={{ width: 320, border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
            <Tree
              data-testid="test-tree"
              value={value}
              onChange={handleTreeChange}
              expanded={expanded}
              onExpandedChange={handleTreeExpandedChange}
            >
              {showMainItems && (
                <>
                  <Tree.Item value="folder-1" data-testid="tree-item-folder-1">
                    <Tree.Expander data-testid="expander-folder-1" aria-label="Toggle Documents" />
                    <span>Documents</span>
                    <Tree.Group data-testid="tree-group-folder-1">
                      {showDoc1 && (
                        <Tree.Item value="doc-1" data-testid="tree-item-doc-1">
                          <span>Resume.pdf</span>
                        </Tree.Item>
                      )}
                      {showDoc2 && (
                        <Tree.Item value="doc-2" data-testid="tree-item-doc-2">
                          <span>Budget.xlsx</span>
                        </Tree.Item>
                      )}
                      <Tree.Item value="subfolder-1" data-testid="tree-item-subfolder-1">
                        <Tree.Expander data-testid="expander-subfolder-1" aria-label="Toggle Archive" />
                        <span>Archive</span>
                        <Tree.Group data-testid="tree-group-subfolder-1">
                          <Tree.Item value="nested-doc-1" data-testid="tree-item-nested-doc-1">
                            <span>2024.pdf</span>
                          </Tree.Item>
                        </Tree.Group>
                      </Tree.Item>
                    </Tree.Group>
                  </Tree.Item>

                  <Tree.Item value="file-readme" data-testid="tree-item-readme">
                    <span>README.md</span>
                  </Tree.Item>

                  <Tree.Item value="disabled-leaf" disabled data-testid="tree-item-disabled-leaf">
                    <span>Disabled Leaf</span>
                  </Tree.Item>

                  <Tree.Item value="charlie" data-testid="tree-item-charlie">
                    <span>Charlie.txt</span>
                  </Tree.Item>

                  <Tree.Item value="alpha" data-testid="tree-item-alpha">
                    {alphaIsBranch && <Tree.Expander data-testid="expander-alpha" />}
                    <span>Alpha Item</span>
                    {alphaIsBranch && (
                      <Tree.Group data-testid="tree-group-alpha">
                        <Tree.Item value="alpha-child" data-testid="tree-item-alpha-child">
                          <span>Alpha Child</span>
                        </Tree.Item>
                      </Tree.Group>
                    )}
                  </Tree.Item>

                  <Tree.Item
                    value="disabled-branch"
                    disabled={ancestorDisabled}
                    data-testid="tree-item-disabled-branch"
                  >
                    <Tree.Expander data-testid="expander-disabled-branch" />
                    <span>Disabled Branch</span>
                    <Tree.Group data-testid="tree-group-disabled-branch">
                      <Tree.Item
                        value="child-under-disabled"
                        disabled={childDisabled}
                        data-testid="tree-item-child-under-disabled"
                      >
                        <span>Child Under Disabled</span>
                      </Tree.Item>
                    </Tree.Group>
                  </Tree.Item>

                  <Tree.Item value="interactive-item" data-testid="tree-item-interactive">
                    <span>Interactive: </span>
                    <input data-testid="item-nested-input" placeholder="nested input" />
                    <button type="button" data-testid="item-nested-button">
                      Click me
                    </button>
                  </Tree.Item>

                  <Tree.Item
                    value="cancel-key-item"
                    data-testid="tree-item-cancel-key"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setKeyLog((prev) => [...prev, 'cancelled-ArrowDown'])
                      }
                    }}
                  >
                    <span>Cancel Key Item</span>
                  </Tree.Item>

                  <Tree.Item value="cancel-expand-branch" data-testid="tree-item-cancel-expand">
                    <Tree.Expander
                      data-testid="expander-cancel-expand"
                      onClick={(e) => {
                        e.preventDefault()
                        setKeyLog((prev) => [...prev, 'expander-preventDefault'])
                      }}
                    />
                    <span>Cancel Expand Branch</span>
                    <Tree.Group>
                      <Tree.Item value="cancel-expand-child">
                        <span>Child</span>
                      </Tree.Item>
                    </Tree.Group>
                  </Tree.Item>

                  <Tree.Item value="creme-item" data-testid="tree-item-creme">
                    <span>Crème Brûlée</span>
                  </Tree.Item>

                  <Tree.Item value="0" data-testid="tree-item-zero">
                    <span>0 backups</span>
                  </Tree.Item>

                  <Tree.Item value="src/index" data-testid="tree-item-path-branch">
                    <Tree.Expander data-testid="expander-path" />
                    <span>src/index</span>
                    <Tree.Group data-testid="tree-group-path">
                      <Tree.Item value="src/index/readme" data-testid="tree-item-path-child">
                        <span>readme.md</span>
                      </Tree.Item>
                    </Tree.Group>
                  </Tree.Item>

                  {showOverride && (
                    <Tree.Item
                      value="typeahead-override-item"
                      textValue={typeaheadTextValue}
                      data-testid="tree-item-typeahead-override"
                    >
                      <span>{typeaheadLabel}</span>
                    </Tree.Item>
                  )}

                  {showDuplicate && (
                    <Tree.Item value="doc-1" data-testid="tree-item-duplicate">
                      <span>Duplicate doc-1</span>
                    </Tree.Item>
                  )}
                </>
              )}
            </Tree>
          </div>

          <p data-testid="tree-value-display">Selected: {value ?? 'None'}</p>
          <p data-testid="tree-expanded-display">Expanded: {expanded.join(', ')}</p>
          <p data-testid="tree-selection-log">SelectionLog: {selectionLog.join(', ')}</p>
          <p data-testid="tree-expansion-log">
            ExpansionLog: {expansionLog.map((arr) => arr.join('+')).join('|')}
          </p>
          <p data-testid="tree-key-log">KeyLog: {keyLog.join(', ')}</p>
        </section>

        <section style={{ margin: '16px 0' }} data-testid="empty-tree-section">
          <h2>Empty Tree</h2>
          <button type="button" data-testid="btn-before-empty">
            Before
          </button>
          <Tree data-testid="empty-tree" value={emptyValue} onChange={setEmptyValue} />
          <button type="button" data-testid="btn-after-empty">
            After
          </button>
        </section>

        <section style={{ margin: '16px 0' }} data-testid="omitted-props-section">
          <h2>Controlled Selection, Default Expansion</h2>
          <Tree data-testid="omitted-tree" value={omittedValue} onChange={setOmittedValue}>
            <Tree.Item value="omitted-branch" data-testid="omitted-branch">
              <Tree.Expander data-testid="omitted-expander" />
              <span>Omitted Branch</span>
              <Tree.Group data-testid="omitted-group">
                <Tree.Item value="omitted-child" data-testid="omitted-child">
                  <span>Omitted Child</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree>
        </section>

        <section style={{ margin: '16px 0' }} data-testid="reorder-section">
          <h2>Reorder &amp; Interleaved Non-Items</h2>
          <Tree data-testid="reorder-tree" value={reorderValue} onChange={setReorderValue}>
            <div data-testid="decorative-heading">Category Header</div>
            <Tree.Item value="item-1" data-testid="reorder-item-1">
              <span>Item 1</span>
            </Tree.Item>
            <div data-testid="decorative-divider" style={{ height: 1, background: '#eee' }} />
            <Tree.Item value="item-2" data-testid="reorder-item-2">
              <span>Item 2</span>
            </Tree.Item>
            <Tree.Item value="item-3" data-testid="reorder-item-3">
              <span>Item 3</span>
            </Tree.Item>
          </Tree>
        </section>

        <section style={{ margin: '16px 0' }} data-testid="deterministic-section">
          <h2>Deterministic Expansion Order</h2>
          <Tree
            data-testid="det-tree"
            value={detValue}
            onChange={setDetValue}
            expanded={detExpanded}
            onExpandedChange={(next) => {
              setDetLog((prev) => [...prev, next])
              setDetExpanded(next)
            }}
          >
            <Tree.Item value="a" data-testid="det-item-a">
              <Tree.Expander data-testid="det-expander-a" />
              <span>A</span>
              <Tree.Group>
                <Tree.Item value="a-child">
                  <span>A child</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item value="b" data-testid="det-item-b">
              <Tree.Expander data-testid="det-expander-b" />
              <span>B</span>
              <Tree.Group>
                <Tree.Item value="b-child">
                  <span>B child</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item value="c" data-testid="det-item-c">
              <Tree.Expander data-testid="det-expander-c" />
              <span>C</span>
              <Tree.Group>
                <Tree.Item value="c-child">
                  <span>C child</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree>
          <p data-testid="det-expansion-log">DetLog: {detLog.map((arr) => arr.join(',')).join('|')}</p>
        </section>

        <section style={{ margin: '16px 0' }} data-testid="refs-section">
          <h2>Ref Forwarding Probes</h2>
          <Tree
            data-testid="refs-tree"
            ref={refsRootRef}
            value={refsValue}
            onChange={setRefsValue}
            defaultExpanded={['refs-branch']}
          >
            <Tree.Item value="refs-branch" data-testid="refs-item" ref={refsItemRef}>
              <Tree.Expander data-testid="refs-expander" ref={refsExpanderRef} />
              <span>Refs Branch</span>
              <Tree.Group
                data-testid="refs-group"
                ref={(node: HTMLDivElement | null) => {
                  refsGroupTag.current = node?.tagName ?? null
                }}
              >
                <Tree.Item value="refs-leaf">
                  <span>Refs Leaf</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree>
          <p data-testid="refs-tags-display">Tags: {refsTags}</p>
        </section>
      </Div>
    </ReferenceLibrary>
  )
}

export const MultiLevel = () => {
  const [selected, setSelected] = React.useState<string | null>('file-switch')
  const [expanded, setExpanded] = React.useState<string[]>([
    'folder-packages',
    'folder-components',
  ])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-multi-root" maxW="90r">
        <Div
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          p="2r"
        >
          <Tree
            data-testid="tree-multi"
            value={selected}
            onChange={setSelected}
            expanded={expanded}
            onExpandedChange={setExpanded}
          >
            <Tree.Item id="folder-packages" isBranch data-testid="tree-folder-packages">
              <Div display="flex" alignItems="center" gap="1.5r">
                <Tree.Expander itemId="folder-packages" />
                <Span fontWeight="600">📦 packages</Span>
              </Div>
              <Tree.Group>
                <Tree.Item id="folder-components" isBranch data-testid="tree-folder-components">
                  <Div display="flex" alignItems="center" gap="1.5r">
                    <Tree.Expander itemId="folder-components" />
                    <Span fontWeight="600">📁 components</Span>
                  </Div>
                  <Tree.Group>
                    <Tree.Item id="file-switch" data-testid="tree-file-switch">
                      <Span>📄 Switch.tsx</Span>
                    </Tree.Item>
                    <Tree.Item id="file-tabs" data-testid="tree-file-tabs">
                      <Span>📄 Tabs.tsx</Span>
                    </Tree.Item>
                  </Tree.Group>
                </Tree.Item>
                <Tree.Item id="file-package-json" data-testid="tree-file-pkg">
                  <Span>📄 package.json</Span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

const ShadowTreeInner = ({ idPrefix }: { idPrefix: string }) => {
  const [value, setValue] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string[]>(['shadow-docs'])

  return (
    <div>
      <Tree
        data-testid={`${idPrefix}-tree`}
        value={value}
        onChange={setValue}
        expanded={expanded}
        onExpandedChange={setExpanded}
      >
        <Tree.Item value="shadow-docs" data-testid={`${idPrefix}-item-docs`}>
          <Tree.Expander data-testid={`${idPrefix}-expander-docs`} aria-label="Toggle Documents" />
          <span>Documents</span>
          <Tree.Group data-testid={`${idPrefix}-group-docs`}>
            <Tree.Item value="shadow-resume" data-testid={`${idPrefix}-item-resume`}>
              <span>Resume.pdf</span>
            </Tree.Item>
            <Tree.Item value="shadow-budget" data-testid={`${idPrefix}-item-budget`}>
              <span>Budget.xlsx</span>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
        <Tree.Item value="shadow-readme" data-testid={`${idPrefix}-item-readme`}>
          <span>README.md</span>
        </Tree.Item>
        <Tree.Item value="shadow-notes" data-testid={`${idPrefix}-item-notes`}>
          <span>Notes.txt</span>
        </Tree.Item>
      </Tree>
      <p data-testid={`${idPrefix}-value-display`}>Selected: {value ?? 'None'}</p>
      <p data-testid={`${idPrefix}-expanded-display`}>Expanded: {expanded.join(', ')}</p>
    </div>
  )
}

const ShadowHost = ({ testId, idPrefix }: { testId: string; idPrefix: string }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shadow, setShadow] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (host.shadowRoot) {
      setShadow(host.shadowRoot)
      return
    }
    setShadow(host.attachShadow({ mode: 'open' }))
  }, [])

  return (
    <>
      <div ref={hostRef} data-testid={testId} />
      {shadow ? createPortal(<ShadowTreeInner idPrefix={idPrefix} />, shadow) : null}
    </>
  )
}

export const Shadow = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="120r">
        <section>
          <h2>Shadow Tree (LTR document)</h2>
          <ShadowHost testId="tree-shadow-host" idPrefix="tree-shadow" />
        </section>
        <section>
          <h2>Shadow Tree under light-DOM RTL ancestor</h2>
          <div dir="rtl" data-testid="tree-shadow-rtl-wrapper">
            <ShadowHost testId="tree-shadow-rtl-host" idPrefix="tree-shadow-rtl" />
          </div>
        </section>
      </Div>
    </ReferenceLibrary>
  )
}

function CbLayerCount({ testid }: { testid: string }) {
  const openLayers = useOverlayStore(state => state.layers.filter(l => l.open).length)
  return <Div data-testid={testid}>{openLayers}</Div>
}

const cbLabels: Record<string, string> = {
  src: 'src',
  'src/index': 'index.ts',
  'src/main': 'main.ts',
  'src/lib': 'lib',
  'src/lib/deep': 'deep.ts',
  docs: 'docs',
  'docs/guide': 'guide.md',
  'docs/new': 'new.md',
  readme: 'README.md',
  'disabled-leaf': 'Disabled Leaf',
}

// Valid bridge anatomy (TR-CB-01..06, TR-COMP-03): a three-level Tree nested
// directly in an editable Combobox.Popover with NO value/onChange of its
// own — selection display follows the root, commits route to the root —
// plus a select-only Trigger section. Structural controls drive the
// TR-CB-05 registry-freshness flow; expansion is controlled and accepted.
export const ComboboxTree = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [expanded, setExpanded] = React.useState<string[]>(['src'])
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])
  const [rejectSelect, setRejectSelect] = React.useState(false)
  const [order, setOrder] = React.useState<string[]>(['src', 'docs', 'readme', 'disabled-leaf'])
  const [showSrc, setShowSrc] = React.useState(true)
  const [renamed, setRenamed] = React.useState(false)
  const [extraChild, setExtraChild] = React.useState(false)

  const indexValue = renamed ? 'src/main' : 'src/index'

  const [selOpen, setSelOpen] = React.useState(false)
  const [selValue, setSelValue] = React.useState<string | null>(null)
  const [selExpanded, setSelExpanded] = React.useState<string[]>(['tb-a'])
  const [selLog, setSelLog] = React.useState<string[]>([])
  const selPush = (entry: string) => setSelLog(prev => [...prev, entry])
  const selLabel = selValue ?? 'Choose'

  const renderRoot = (key: string) => {
    if (key === 'src') {
      if (!showSrc) return null
      return (
        <Tree.Item key="src" value="src" data-testid="cb-item-src">
          <Tree.Expander data-testid="cb-expander-src" aria-label="Toggle src" />
          <span>src</span>
          <Tree.Group data-testid="cb-group-src">
            <Tree.Item key="cb-index" value={indexValue} data-testid="cb-item-index">
              <span>{renamed ? 'main.ts' : 'index.ts'}</span>
            </Tree.Item>
            <Tree.Item key="cb-lib" value="src/lib" data-testid="cb-item-lib">
              <Tree.Expander data-testid="cb-expander-lib" aria-label="Toggle lib" />
              <span>lib</span>
              <Tree.Group data-testid="cb-group-lib">
                <Tree.Item value="src/lib/deep" data-testid="cb-item-deep">
                  <span>deep.ts</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
      )
    }
    if (key === 'docs') {
      return (
        <Tree.Item key="docs" value="docs" data-testid="cb-item-docs">
          <Tree.Expander data-testid="cb-expander-docs" aria-label="Toggle docs" />
          <span>docs</span>
          <Tree.Group data-testid="cb-group-docs">
            <Tree.Item value="docs/guide" data-testid="cb-item-guide">
              <span>guide.md</span>
            </Tree.Item>
            {extraChild && (
              <Tree.Item value="docs/new" data-testid="cb-item-new">
                <span>new.md</span>
              </Tree.Item>
            )}
          </Tree.Group>
        </Tree.Item>
      )
    }
    if (key === 'readme') {
      return (
        <Tree.Item key="readme" value="readme" data-testid="cb-item-readme">
          <span>README.md</span>
        </Tree.Item>
      )
    }
    return (
      <Tree.Item key="disabled-leaf" value="disabled-leaf" disabled data-testid="cb-item-disabled">
        <span>Disabled Leaf</span>
      </Tree.Item>
    )
  }

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="120r">
        <section>
          <h2>Editable Combobox Tree</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button type="button" data-testid="cb-toggle-reject" onClick={() => setRejectSelect(p => !p)}>
              Toggle Reject Select ({rejectSelect ? 'ON' : 'OFF'})
            </button>
            <button type="button" data-testid="cb-reorder" onClick={() => setOrder(prev => [...prev].reverse())}>
              Reverse root order
            </button>
            <button type="button" data-testid="cb-toggle-src" onClick={() => setShowSrc(p => !p)}>
              Toggle src branch
            </button>
            <button type="button" data-testid="cb-rename" onClick={() => setRenamed(true)}>
              Rename index to main
            </button>
            <button type="button" data-testid="cb-add-child" onClick={() => setExtraChild(true)}>
              Add docs child
            </button>
            <button type="button" data-testid="cb-collapse-src" onClick={() => setExpanded(prev => prev.filter(v => v !== 'src'))}>
              Collapse src
            </button>
            <button type="button" data-testid="cb-expand-docs" onClick={() => setExpanded(prev => (prev.includes('docs') ? prev : [...prev, 'docs']))}>
              Expand docs
            </button>
            <button type="button" data-testid="cb-select-readme" onClick={() => setValue('readme')}>
              Programmatic select readme
            </button>
            <button type="button" data-testid="cb-clear-log" onClick={() => setLog([])}>
              Clear log
            </button>
          </div>
          <div style={{ width: 320 }}>
            <Combobox
              open={open}
              onOpen={() => {
                push('open')
                setOpen(true)
              }}
              onDismiss={() => {
                push('dismiss')
                setOpen(false)
              }}
              value={value}
              onChange={v => {
                push(`change:${v}`)
                if (!rejectSelect) {
                  setValue(v)
                  setInputValue(v != null ? (cbLabels[v] ?? v) : '')
                }
              }}
              inputValue={inputValue}
              onInputValueChange={v => {
                push(`input:${v}`)
                setInputValue(v)
              }}
            >
              <Field>
                <Combobox.Input data-testid="cb-input" placeholder="Search..." />
              </Field>
              <Combobox.Popover data-testid="cb-popover">
                <Tree
                  data-testid="cb-tree"
                  expanded={expanded}
                  onExpandedChange={next => {
                    push(`expanded:${next.join('+')}`)
                    setExpanded(next)
                  }}
                >
                  {order.map(renderRoot)}
                </Tree>
              </Combobox.Popover>
            </Combobox>
          </div>
          <p data-testid="cb-log">{JSON.stringify(log)}</p>
          <p data-testid="cb-value">Selected: {value ?? 'None'}</p>
          <p data-testid="cb-expanded">Expanded: {expanded.join(', ')}</p>
          <CbLayerCount testid="cb-layers" />
        </section>

        <section>
          <h2>Select-only Combobox Tree</h2>
          <div style={{ width: 320 }}>
            <Combobox
              open={selOpen}
              onOpen={() => {
                selPush('open')
                setSelOpen(true)
              }}
              onDismiss={() => {
                selPush('dismiss')
                setSelOpen(false)
              }}
              value={selValue}
              onChange={v => {
                selPush(`change:${v}`)
                setSelValue(v)
              }}
            >
              <Combobox.Trigger data-testid="cbs-trigger">{selLabel}</Combobox.Trigger>
              <Combobox.Popover data-testid="cbs-popover">
                <Tree
                  data-testid="cbs-tree"
                  expanded={selExpanded}
                  onExpandedChange={next => {
                    selPush(`expanded:${next.join('+')}`)
                    setSelExpanded(next)
                  }}
                >
                  <Tree.Item value="tb-a" data-testid="cbs-item-a">
                    <Tree.Expander data-testid="cbs-expander-a" aria-label="Toggle A" />
                    <span>Branch A</span>
                    <Tree.Group data-testid="cbs-group-a">
                      <Tree.Item value="tb-a1" data-testid="cbs-item-a1">
                        <span>Leaf A1</span>
                      </Tree.Item>
                    </Tree.Group>
                  </Tree.Item>
                  <Tree.Item value="tb-b" data-testid="cbs-item-b">
                    <span>Leaf B</span>
                  </Tree.Item>
                </Tree>
              </Combobox.Popover>
            </Combobox>
          </div>
          <p data-testid="cbs-log">{JSON.stringify(selLog)}</p>
        </section>
      </Div>
    </ReferenceLibrary>
  )
}

// Invalid bridge anatomy (TR-CB-04): a nested Tree onChange diagnoses and
// is never invoked — activation still commits only through root onChange.
export const ComboboxTreeInvalid = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [expanded, setExpanded] = React.useState<string[]>(['ci-src'])
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="120r">
        <div style={{ width: 320 }}>
          <Combobox
            open={open}
            onOpen={() => {
              push('open')
              setOpen(true)
            }}
            onDismiss={() => {
              push('dismiss')
              setOpen(false)
            }}
            value={value}
            onChange={v => {
              push(`change:${v}`)
              setValue(v)
              setInputValue(v ?? '')
            }}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="cbi-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="cbi-popover">
              <Tree
                data-testid="cbi-tree"
                value={value}
                onChange={v => push(`tree:${v}`)}
                expanded={expanded}
                onExpandedChange={next => {
                  push(`expanded:${next.join('+')}`)
                  setExpanded(next)
                }}
              >
                <Tree.Item value="ci-src" data-testid="cbi-item-src">
                  <Tree.Expander data-testid="cbi-expander-src" aria-label="Toggle src" />
                  <span>src</span>
                  <Tree.Group data-testid="cbi-group-src">
                    <Tree.Item value="ci-index" data-testid="cbi-item-index">
                      <span>index.ts</span>
                    </Tree.Item>
                  </Tree.Group>
                </Tree.Item>
                <Tree.Item value="ci-readme" data-testid="cbi-item-readme">
                  <span>README.md</span>
                </Tree.Item>
              </Tree>
            </Combobox.Popover>
          </Combobox>
        </div>
        <p data-testid="cbi-log">{JSON.stringify(log)}</p>
      </Div>
    </ReferenceLibrary>
  )
}

type DynNode = { value: string; label: string; children: DynNode[] }

const dynInitial: DynNode[] = [
  {
    value: 'a',
    label: 'Branch A',
    children: [
      { value: 'a1', label: 'A1', children: [] },
      {
        value: 'a2',
        label: 'A2',
        children: [{ value: 'a2i', label: 'A2i', children: [] }],
      },
    ],
  },
  {
    value: 'b',
    label: 'Branch B',
    children: [{ value: 'b1', label: 'B1', children: [] }],
  },
]

const DynSubtree = ({ node }: { node: DynNode }) => {
  if (node.children.length === 0) {
    return (
      <Tree.Item value={node.value} data-testid={`dyn-item-${node.value}`}>
        <span>{node.label}</span>
      </Tree.Item>
    )
  }
  return (
    <Tree.Item value={node.value} data-testid={`dyn-item-${node.value}`}>
      <Tree.Expander data-testid={`dyn-expander-${node.value}`} aria-label={`Toggle ${node.label}`} />
      <span>{node.label}</span>
      <Tree.Group data-testid={`dyn-group-${node.value}`}>
        {node.children.map(child => (
          <DynSubtree key={child.value} node={child} />
        ))}
      </Tree.Group>
    </Tree.Item>
  )
}

const dynHas = (nodes: DynNode[], value: string): boolean =>
  nodes.some(n => n.value === value || dynHas(n.children, value))

const dynRemove = (nodes: DynNode[], value: string): DynNode[] =>
  nodes
    .filter(n => n.value !== value)
    .map(n => ({ ...n, children: dynRemove(n.children, value) }))

const dynFind = (nodes: DynNode[], value: string): DynNode | null => {
  for (const n of nodes) {
    if (n.value === value) return n
    const hit = dynFind(n.children, value)
    if (hit) return hit
  }
  return null
}

// Structural-editing fixture (TR-DYNAMIC-01/02): insert, remove, reorder,
// and cross-parent moves at root and nested levels, plus empty and
// single-branch states. Each op is a fixed deterministic edit.
export const DynamicHierarchy = () => {
  const [nodes, setNodes] = React.useState<DynNode[]>(dynInitial)
  const [value, setValue] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string[]>(['a', 'a2', 'b'])
  const [selectionLog, setSelectionLog] = React.useState<string[]>([])
  const [expansionLog, setExpansionLog] = React.useState<string[][]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tree-fixture-root" maxW="120r">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            type="button"
            data-testid="dyn-add-root-leaf"
            onClick={() =>
              setNodes(prev =>
                dynHas(prev, 'c') ? prev : [...prev, { value: 'c', label: 'C', children: [] }]
              )
            }
          >
            Add root leaf C
          </button>
          <button
            type="button"
            data-testid="dyn-add-nested-leaf"
            onClick={() =>
              setNodes(prev => {
                if (dynHas(prev, 'a3')) return prev
                return prev.map(n =>
                  n.value === 'a'
                    ? { ...n, children: [...n.children, { value: 'a3', label: 'A3', children: [] }] }
                    : n
                )
              })
            }
          >
            Add nested leaf A3
          </button>
          <button
            type="button"
            data-testid="dyn-add-root-branch"
            onClick={() =>
              setNodes(prev =>
                dynHas(prev, 'd')
                  ? prev
                  : [
                      ...prev,
                      {
                        value: 'd',
                        label: 'Branch D',
                        children: [{ value: 'd1', label: 'D1', children: [] }],
                      },
                    ]
              )
            }
          >
            Add root branch D
          </button>
          <button
            type="button"
            data-testid="dyn-reorder-roots"
            onClick={() => setNodes(prev => [...prev].reverse())}
          >
            Reverse roots
          </button>
          <button
            type="button"
            data-testid="dyn-reorder-nested"
            onClick={() =>
              setNodes(prev =>
                prev.map(n =>
                  n.value === 'a' ? { ...n, children: [...n.children].reverse() } : n
                )
              )
            }
          >
            Reverse A children
          </button>
          <button
            type="button"
            data-testid="dyn-remove-leaf"
            onClick={() => setNodes(prev => dynRemove(prev, 'a1'))}
          >
            Remove leaf A1
          </button>
          <button
            type="button"
            data-testid="dyn-remove-branch"
            onClick={() => setNodes(prev => dynRemove(prev, 'd'))}
          >
            Remove branch D
          </button>
          <button
            type="button"
            data-testid="dyn-move-within"
            onClick={() =>
              setNodes(prev => {
                const hit = dynFind(prev, 'a')
                if (!hit) return prev
                return [...dynRemove(prev, 'a'), hit]
              })
            }
          >
            Move A to root end
          </button>
          <button
            type="button"
            data-testid="dyn-move-under-b"
            onClick={() =>
              setNodes(prev => {
                const hit = dynFind(prev, 'a')
                if (!hit) return prev
                const rest = dynRemove(prev, 'a')
                return rest.map(n =>
                  n.value === 'b' ? { ...n, children: [...n.children, hit] } : n
                )
              })
            }
          >
            Move A under B
          </button>
          <button type="button" data-testid="dyn-clear" onClick={() => setNodes([])}>
            Clear all
          </button>
          <button
            type="button"
            data-testid="dyn-single"
            onClick={() =>
              setNodes([
                {
                  value: 's',
                  label: 'Solo',
                  children: [{ value: 's1', label: 'S1', children: [] }],
                },
              ])
            }
          >
            Single branch
          </button>
          <button type="button" data-testid="dyn-reset" onClick={() => setNodes(dynInitial)}>
            Reset
          </button>
        </div>
        <div style={{ width: 320, border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
          <Tree
            data-testid="dyn-tree"
            value={value}
            onChange={next => {
              setSelectionLog(prev => [...prev, String(next)])
              setValue(next)
            }}
            expanded={expanded}
            onExpandedChange={next => {
              setExpansionLog(prev => [...prev, next])
              setExpanded(next)
            }}
          >
            {nodes.map(node => (
              <DynSubtree key={node.value} node={node} />
            ))}
          </Tree>
        </div>
        <p data-testid="dyn-value">Selected: {value ?? 'None'}</p>
        <p data-testid="dyn-expanded">Expanded: {expanded.join(', ')}</p>
        <p data-testid="dyn-selection-log">SelectionLog: {selectionLog.join(', ')}</p>
        <p data-testid="dyn-expansion-log">
          ExpansionLog: {expansionLog.map(arr => arr.join('+')).join('|')}
        </p>
      </Div>
    </ReferenceLibrary>
  )
}
