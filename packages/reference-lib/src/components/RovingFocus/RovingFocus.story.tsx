import * as React from 'react'
import { RovingFocus } from './RovingFocus'

export function RovingFocusFixture() {
  const [orientation, setOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal')
  const [loop, setLoop] = React.useState(true)
  const [typeahead, setTypeahead] = React.useState(true)

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
    fontSize: '14px',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.4,
    cursor: 'not-allowed',
    background: '#f1f5f9',
  }

  return (
    <div
      data-testid="roving-focus-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>RovingFocus Fixture</h2>

      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="outside-before-btn"
          style={buttonStyle}
        >
          Outside Before
        </button>
      </div>

      <section style={{ margin: '16px 0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Toolbar Composite</h3>
        <RovingFocus.Root
          orientation={orientation}
          loop={loop}
          typeahead={typeahead}
        >
          <div
            role="toolbar"
            data-testid="toolbar-composite"
            style={{
              display: 'flex',
              gap: '8px',
              border: '1px solid #94a3b8',
              borderRadius: '6px',
              padding: '12px',
              background: '#f8fafc',
            }}
          >
            <RovingFocus.Item id="item-apple" textValue="Apple">
              <button
                type="button"
                data-testid="item-apple"
                style={buttonStyle}
              >
                Apple
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-banana" textValue="Banana" disabled>
              <button
                type="button"
                data-testid="item-banana"
                disabled
                style={disabledButtonStyle}
              >
                Banana (Disabled)
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-blueberry" textValue="Blueberry">
              <button
                type="button"
                data-testid="item-blueberry"
                style={buttonStyle}
              >
                Blueberry
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-cherry" textValue="Cherry">
              <button
                type="button"
                data-testid="item-cherry"
                style={buttonStyle}
              >
                Cherry
              </button>
            </RovingFocus.Item>
          </div>
        </RovingFocus.Root>
      </section>

      <div>
        <button
          type="button"
          data-testid="outside-after-btn"
          style={buttonStyle}
        >
          Outside After
        </button>
      </div>
    </div>
  )
}

// PATCHES #1 (RF-TYPE-06) fixture: separate story so the main fixture — and
// its snapshots — stay byte-identical. "Blueberry" vs "Blue Berry" keeps the
// "blue" prefix ambiguous until Space disambiguates; the counter records
// every native button activation.
const spaceButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: '14px',
}

export function RovingFocusSpaceFixture() {
  const [activations, setActivations] = React.useState(0)
  const countActivation = () => setActivations(c => c + 1)

  return (
    <div
      data-testid="roving-focus-space-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <RovingFocus.Root orientation="horizontal" loop typeahead>
        <div
          role="toolbar"
          data-testid="space-toolbar"
          style={{
            display: 'flex',
            gap: '8px',
            border: '1px solid #94a3b8',
            borderRadius: '6px',
            padding: '12px',
            background: '#f8fafc',
          }}
        >
          <RovingFocus.Item id="space-blueberry" textValue="Blueberry">
            <button
              type="button"
              data-testid="space-blueberry"
              onClick={countActivation}
              style={spaceButtonStyle}
            >
              Blueberry
            </button>
          </RovingFocus.Item>

          <RovingFocus.Item id="space-blue-berry" textValue="Blue Berry">
            <button
              type="button"
              data-testid="space-blue-berry"
              onClick={countActivation}
              style={spaceButtonStyle}
            >
              Blue Berry
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>

      <div data-testid="space-activation-count">{activations}</div>
    </div>
  )
}

// ---------- Finish-line proof fixtures (grid, slot, keys, nesting) ----------

const proofButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: '14px',
}

const GRID_LABELS = ['Apple', 'Blueberry', 'Cherry', 'Date', 'Éclair', 'Fig', 'Grape', 'Honeydew', 'Kiwi']

export function RovingFocusGridFixture(props: {
  loop?: boolean
  dir?: 'ltr' | 'rtl'
  typeahead?: boolean
  disabledEdges?: boolean
}) {
  return (
    <div
      dir={props.dir ?? 'ltr'}
      data-testid="roving-focus-grid-root"
      style={{ padding: '24px', fontFamily: 'sans-serif' }}
    >
      <RovingFocus.Root
        orientation="both"
        loop={props.loop}
        typeahead={props.typeahead}
      >
        <div
          role="grid"
          aria-label="Fruit picker"
          data-testid="grid-composite"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 96px)', gap: '8px' }}
        >
          {GRID_LABELS.map((label, i) => {
            const edgeDisabled = props.disabledEdges === true && (i === 0 || i === 8)
            return (
              <RovingFocus.Item key={label} id={`g-${i}`} textValue={label} disabled={edgeDisabled}>
                <button
                  type="button"
                  data-testid={`grid-${i}`}
                  disabled={edgeDisabled}
                  style={{ width: '96px', height: '40px', ...proofButtonStyle, padding: '4px' }}
                >
                  {label}
                </button>
              </RovingFocus.Item>
            )
          })}
        </div>
      </RovingFocus.Root>
    </div>
  )
}

// Ragged grid (RF-GRID-02/03/04/05): 4 columns of 100px + 10px gap. Row 0 is
// one centered cell M (center x=215); row 1 is L (50), D (160, disabled),
// R (380) — L/R exactly equidistant from M; row 2 is full-width W (215).
export function RovingFocusRaggedGridFixture(props: { loop?: boolean }) {
  return (
    <div data-testid="roving-focus-ragged-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <RovingFocus.Root orientation="both" loop={props.loop}>
        <div
          role="grid"
          aria-label="Ragged picker"
          data-testid="ragged-composite"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 100px)', gap: '10px' }}
        >
          <RovingFocus.Item id="rag-m" textValue="Mike">
            <button
              type="button"
              data-testid="rag-m"
              style={{ gridColumn: '2 / 4', height: '40px', ...proofButtonStyle, padding: '4px' }}
            >
              Mike
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="rag-l" textValue="Lima">
            <button
              type="button"
              data-testid="rag-l"
              style={{ gridColumn: '1 / 2', height: '40px', ...proofButtonStyle, padding: '4px' }}
            >
              Lima
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="rag-d" textValue="Delta" disabled>
            <button
              type="button"
              data-testid="rag-d"
              disabled
              style={{
                gridColumn: '2 / 3',
                height: '40px',
                ...proofButtonStyle,
                padding: '4px',
                opacity: 0.4,
              }}
            >
              Delta
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="rag-r" textValue="Romeo">
            <button
              type="button"
              data-testid="rag-r"
              style={{ gridColumn: '4 / 5', height: '40px', ...proofButtonStyle, padding: '4px' }}
            >
              Romeo
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="rag-w" textValue="Whiskey">
            <button
              type="button"
              data-testid="rag-w"
              style={{ gridColumn: '1 / 5', height: '40px', ...proofButtonStyle, padding: '4px' }}
            >
              Whiskey
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    </div>
  )
}

const FLOW_LABELS = ['Apple', 'Blueberry', 'Cherry', 'Date', 'Éclair', 'Fig']

// Wrapping flex grid (RF-GRID-07, RF-COMP-03): 100px cells + 8px gap in a
// 340px container (3 per row); Narrow drops it to 220px (2 per row) through
// a ref write so the collection never rerenders.
export function RovingFocusReflowFixture(props: {
  dir?: 'ltr' | 'rtl'
  typeahead?: boolean
  loop?: boolean
}) {
  const [dir, setDir] = React.useState<'ltr' | 'rtl'>(props.dir ?? 'ltr')
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  return (
    <div dir={dir} data-testid="roving-focus-reflow-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <RovingFocus.Root orientation="both" loop={props.loop} typeahead={props.typeahead ?? true}>
        <div
          ref={containerRef}
          role="grid"
          aria-label="Reflow picker"
          data-testid="reflow-composite"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '340px' }}
        >
          {FLOW_LABELS.map((label, i) => (
            <RovingFocus.Item key={label} id={`flow-${i}`} textValue={label}>
              <button
                type="button"
                data-testid={`flow-${i}`}
                style={{ width: '100px', height: '40px', ...proofButtonStyle, padding: '4px' }}
              >
                {label}
              </button>
            </RovingFocus.Item>
          ))}
        </div>
      </RovingFocus.Root>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          data-testid="reflow-narrow"
          style={proofButtonStyle}
          onClick={() => {
            if (containerRef.current) containerRef.current.style.width = '220px'
          }}
        >
          Narrow
        </button>
        <button
          type="button"
          data-testid="reflow-toggle-dir"
          style={proofButtonStyle}
          onClick={() => setDir(d => (d === 'ltr' ? 'rtl' : 'ltr'))}
        >
          Dir: {dir}
        </button>
      </div>
    </div>
  )
}

// Generic 1D row (RF-KEY-02/03/05/08/09/10/11/12, RF-TAB-03/05): A B C D E
// with C disabled. cancelMode arms B's child key handler; the toolbar counts
// ancestor keydowns; Rerender forces unrelated parent renders.
export function RovingFocusKeysFixture(props: {
  orientation?: 'horizontal' | 'vertical'
  loop?: boolean
  dir?: 'ltr' | 'rtl'
  typeahead?: boolean
  cancelMode?: 'none' | 'prevent' | 'stop'
}) {
  const [dir, setDir] = React.useState<'ltr' | 'rtl'>(props.dir ?? 'ltr')
  const [ticks, setTicks] = React.useState(0)
  const [ancestorCount, setAncestorCount] = React.useState(0)
  const [cancelFlag, setCancelFlag] = React.useState('no')
  const mode = props.cancelMode ?? 'none'
  const items = [
    { id: 'keys-a', label: 'Alpha' },
    { id: 'keys-b', label: 'Bravo' },
    { id: 'keys-c', label: 'Charlie', disabled: true },
    { id: 'keys-d', label: 'Delta' },
    { id: 'keys-e', label: 'Echo' },
  ]
  return (
    <div dir={dir} data-testid="roving-focus-keys-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <button type="button" data-testid="keys-outside-before" style={proofButtonStyle}>
        Before
      </button>
      <RovingFocus.Root
        orientation={props.orientation}
        loop={props.loop}
        typeahead={props.typeahead}
      >
        <div
          role="toolbar"
          aria-label="Keys"
          data-testid="keys-toolbar"
          onKeyDown={() => setAncestorCount(c => c + 1)}
          style={{ display: 'flex', gap: '8px', margin: '12px 0' }}
        >
          {items.map(item => (
            <RovingFocus.Item
              key={item.id}
              id={item.id}
              textValue={item.label}
              disabled={item.disabled}
            >
              <button
                type="button"
                data-testid={item.id}
                disabled={item.disabled}
                style={proofButtonStyle}
                onKeyDown={
                  item.id === 'keys-b' && mode !== 'none'
                    ? (e: React.KeyboardEvent) => {
                        setCancelFlag('yes')
                        if (mode === 'prevent') e.preventDefault()
                        else e.stopPropagation()
                      }
                    : undefined
                }
              >
                {item.label}
              </button>
            </RovingFocus.Item>
          ))}
        </div>
      </RovingFocus.Root>
      <button type="button" data-testid="keys-outside-after" style={proofButtonStyle}>
        After
      </button>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          data-testid="keys-rerender"
          style={proofButtonStyle}
          onClick={() => setTicks(t => t + 1)}
        >
          Rerender {ticks}
        </button>
        <button
          type="button"
          data-testid="keys-toggle-dir"
          style={proofButtonStyle}
          onClick={() => setDir(d => (d === 'ltr' ? 'rtl' : 'ltr'))}
        >
          Dir: {dir}
        </button>
      </div>
      <div data-testid="keys-ancestor-count">{ancestorCount}</div>
      <div data-testid="keys-cancel-flag">{cancelFlag}</div>
    </div>
  )
}

// Dynamic collection (RF-DOM-04, RF-TAB-06/07, RF-COMP-02): scripted insert /
// reorder / remove plus disable / hide / remove-current and disable-all.
export function RovingFocusDynamicFixture(props: { orientation?: 'horizontal' | 'vertical' }) {
  const [items, setItems] = React.useState<string[]>(['a', 'b', 'c'])
  const [disabledIds, setDisabledIds] = React.useState<string[]>([])
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([])
  return (
    <div data-testid="roving-focus-dynamic-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <button type="button" data-testid="dyn-outside-before" style={proofButtonStyle}>
        Before
      </button>
      <RovingFocus.Root orientation={props.orientation ?? 'horizontal'}>
        <div
          role="toolbar"
          aria-label="Dynamic"
          data-testid="dyn-composite"
          style={{ display: 'flex', gap: '8px', margin: '12px 0' }}
        >
          {items.map(id => (
            <RovingFocus.Item
              key={id}
              id={`dyn-${id}`}
              textValue={id.toUpperCase()}
              disabled={disabledIds.includes(id)}
            >
              <button
                type="button"
                data-testid={`dyn-${id}`}
                disabled={disabledIds.includes(id)}
                hidden={hiddenIds.includes(id)}
                style={proofButtonStyle}
              >
                {id.toUpperCase()}
              </button>
            </RovingFocus.Item>
          ))}
        </div>
      </RovingFocus.Root>
      <button type="button" data-testid="dyn-outside-after" style={proofButtonStyle}>
        After
      </button>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="dyn-insert"
          style={proofButtonStyle}
          onClick={() => setItems(prev => (prev.includes('d') ? prev : ['a', 'b', 'd', 'c'].filter(x => prev.includes(x) || x === 'd')))}
        >
          Insert D
        </button>
        <button
          type="button"
          data-testid="dyn-reorder"
          style={proofButtonStyle}
          onClick={() => setItems(prev => [...prev].reverse())}
        >
          Reverse
        </button>
        <button
          type="button"
          data-testid="dyn-remove-b"
          style={proofButtonStyle}
          onClick={() => setItems(prev => prev.filter(x => x !== 'b'))}
        >
          Remove B
        </button>
        <button
          type="button"
          data-testid="dyn-remove-c"
          style={proofButtonStyle}
          onClick={() => setItems(prev => prev.filter(x => x !== 'c'))}
        >
          Remove C
        </button>
        <button
          type="button"
          data-testid="dyn-disable-b"
          style={proofButtonStyle}
          onClick={() => setDisabledIds(prev => (prev.includes('b') ? prev : [...prev, 'b']))}
        >
          Disable B
        </button>
        <button
          type="button"
          data-testid="dyn-hide-b"
          style={proofButtonStyle}
          onClick={() => setHiddenIds(prev => (prev.includes('b') ? prev : [...prev, 'b']))}
        >
          Hide B
        </button>
        <button
          type="button"
          data-testid="dyn-disable-all"
          style={proofButtonStyle}
          onClick={() => setDisabledIds(['a', 'b', 'c', 'd'])}
        >
          Disable all
        </button>
        <button
          type="button"
          data-testid="dyn-reset"
          style={proofButtonStyle}
          onClick={() => {
            setItems(['a', 'b', 'c'])
            setDisabledIds([])
            setHiddenIds([])
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

// Typeahead labels (RF-TYPE-01/09/10/11/12): conflicting text sources with
// removal buttons, decorative glyphs + irregular whitespace, an editable
// descendant, and disable/unmount-mid-buffer controls.
export function RovingFocusLabelsFixture(props: { typeahead?: boolean }) {
  const [textValue, setTextValue] = React.useState<string | undefined>('Xray')
  const [ariaLabel, setAriaLabel] = React.useState<string | undefined>('Yankee')
  const [bravoDisabled, setBravoDisabled] = React.useState(false)
  const [bravoRemoved, setBravoRemoved] = React.useState(false)
  const [activations, setActivations] = React.useState(0)
  return (
    <div data-testid="roving-focus-labels-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <RovingFocus.Root orientation="horizontal" typeahead={props.typeahead}>
        <div role="toolbar" aria-label="Labels" data-testid="labels-composite" style={{ display: 'flex', gap: '8px' }}>
          <RovingFocus.Item id="labels-x" textValue={textValue}>
            <button type="button" data-testid="labels-x" aria-label={ariaLabel} style={proofButtonStyle}>
              Zulu
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="labels-decor">
            <button type="button" data-testid="labels-decor" style={proofButtonStyle}>
              <span aria-hidden="true">★</span>
              {'  Spaced\tOut\nLabel  '}
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="labels-input-item">
            <div data-testid="labels-input-item">
              <input
                data-testid="labels-input"
                tabIndex={-1}
                defaultValue=""
                aria-label="Note"
                style={{ width: '80px' }}
              />
              <span>Input item</span>
            </div>
          </RovingFocus.Item>
          {!bravoRemoved && (
            <RovingFocus.Item id="labels-bravo" textValue="Bravo" disabled={bravoDisabled}>
              <button
                type="button"
                data-testid="labels-bravo"
                disabled={bravoDisabled}
                onClick={() => setActivations(c => c + 1)}
                style={proofButtonStyle}
              >
                Bravo
              </button>
            </RovingFocus.Item>
          )}
          <RovingFocus.Item id="labels-bread" textValue="Bread">
            <button
              type="button"
              data-testid="labels-bread"
              onClick={() => setActivations(c => c + 1)}
              style={proofButtonStyle}
            >
              Bread
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" data-testid="labels-drop-textvalue" style={proofButtonStyle} onClick={() => setTextValue(undefined)}>
          Drop textValue
        </button>
        <button type="button" data-testid="labels-drop-aria" style={proofButtonStyle} onClick={() => setAriaLabel(undefined)}>
          Drop aria-label
        </button>
        <button type="button" data-testid="labels-disable-bravo" style={proofButtonStyle} onClick={() => setBravoDisabled(true)}>
          Disable Bravo
        </button>
        <button type="button" data-testid="labels-remove-bravo" style={proofButtonStyle} onClick={() => setBravoRemoved(true)}>
          Remove Bravo
        </button>
      </div>
      <div data-testid="labels-activation-count">{activations}</div>
    </div>
  )
}

// Nested composites (RF-NEST-01/02): vertical outer A/B/C with a horizontal
// inner X/Y/Z inside B's subtree.
export function RovingFocusNestedFixture() {
  return (
    <div data-testid="roving-focus-nested-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <RovingFocus.Root orientation="vertical" loop={false}>
        <div role="list" aria-label="Outer" data-testid="nested-outer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <RovingFocus.Item id="n-a" textValue="Alpha">
            <button type="button" data-testid="nested-a" style={proofButtonStyle}>
              Alpha
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="n-b" textValue="Beta">
            <div data-testid="nested-b" style={{ border: '1px solid #94a3b8', padding: '8px' }}>
              <span>Beta</span>
              <RovingFocus.Root orientation="horizontal" loop={false}>
                <div role="toolbar" aria-label="Inner" data-testid="nested-inner" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <RovingFocus.Item id="n-x" textValue="Xray">
                    <button type="button" data-testid="nested-x" style={proofButtonStyle}>
                      Xray
                    </button>
                  </RovingFocus.Item>
                  <RovingFocus.Item id="n-y" textValue="Yankee">
                    <button type="button" data-testid="nested-y" style={proofButtonStyle}>
                      Yankee
                    </button>
                  </RovingFocus.Item>
                  <RovingFocus.Item id="n-z" textValue="Zulu">
                    <button type="button" data-testid="nested-z" style={proofButtonStyle}>
                      Zulu
                    </button>
                  </RovingFocus.Item>
                </div>
              </RovingFocus.Root>
            </div>
          </RovingFocus.Item>
          <RovingFocus.Item id="n-c" textValue="Charlie">
            <button type="button" data-testid="nested-c" style={proofButtonStyle}>
              Charlie
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    </div>
  )
}

// Empty composite (RF-DOM-03): a marked authored container with no Items.
export function RovingFocusEmptyFixture() {
  return (
    <div data-testid="roving-focus-empty-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <button type="button" data-testid="empty-before" style={proofButtonStyle}>
        Before
      </button>
      <RovingFocus.Root orientation="horizontal">
        <div role="toolbar" aria-label="Empty" data-testid="empty-container" style={{ margin: '12px 0' }} />
      </RovingFocus.Root>
      <button type="button" data-testid="empty-after" style={proofButtonStyle}>
        After
      </button>
    </div>
  )
}

// StrictMode + ref-driven rerender (RF-DOM-05): the gallery already mounts
// StrictMode; the probe ref schedules exactly one state update.
export function RovingFocusStrictRefFixture() {
  const [, setTick] = React.useState(0)
  const firedRef = React.useRef(false)
  const rendersRef = React.useRef(0)
  rendersRef.current += 1
  const probeRef = React.useCallback(() => {
    if (!firedRef.current) {
      firedRef.current = true
      setTick(t => t + 1)
    }
  }, [])
  return (
    <div data-testid="roving-focus-strict-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <RovingFocus.Root orientation="horizontal">
        <div role="toolbar" aria-label="Strict" data-testid="strict-composite" style={{ display: 'flex', gap: '8px' }}>
          {['Apple', 'Banana', 'Cherry', 'Date'].map(label => (
            <RovingFocus.Item key={label} id={`strict-${label}`} textValue={label}>
              <button
                type="button"
                data-testid={`strict-${label}`}
                style={proofButtonStyle}
                ref={label === 'Banana' ? () => probeRef() : undefined}
              >
                {label}
              </button>
            </RovingFocus.Item>
          ))}
        </div>
      </RovingFocus.Root>
      <div data-testid="strict-renders">{rendersRef.current}</div>
    </div>
  )
}

// Transparent slot composition (RF-DOM-01/02, RF-TAB-08, RF-COMP-01): toolbar
// div with button + link children, conflicting tabIndex values, a disabled
// middle item, part-level css/className/handlers/ref on Bold.
export function RovingFocusSlotFixture(props: { loop?: boolean }) {
  const [clicks, setClicks] = React.useState(0)
  return (
    <div data-testid="roving-focus-slot-root" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <button type="button" data-testid="slot-outside-before" style={proofButtonStyle}>
        Before
      </button>
      <RovingFocus.Root loop={props.loop} className="root-part-class" data-root-part="yes">
        <div
          role="toolbar"
          aria-label="Formatting"
          data-testid="slot-toolbar"
          className="toolbar-child-class"
          style={{ display: 'flex', gap: '8px', margin: '12px 0' }}
        >
          <RovingFocus.Item
            id="slot-bold"
            css={{ display: 'flex' }}
            className="item-part-class"
            onClick={() => setClicks(c => c + 1)}
            ref={node => {
              const state = document.querySelector('[data-testid="slot-ref-state"]')
              if (state) state.textContent = node ? node.tagName : 'null'
            }}
          >
            <button
              type="button"
              data-testid="slot-bold"
              tabIndex={2}
              className="bold-child-class"
              style={proofButtonStyle}
              onClick={() => setClicks(c => c + 10)}
            >
              Bold
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="slot-italic" disabled>
            <button type="button" data-testid="slot-italic" disabled tabIndex={0} style={proofButtonStyle}>
              Italic
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item id="slot-link">
            <a href="#slot" data-testid="slot-link" tabIndex={-1} style={proofButtonStyle}>
              Link
            </a>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
      <button type="button" data-testid="slot-outside-after" style={proofButtonStyle}>
        After
      </button>
      <div data-testid="slot-click-count">{clicks}</div>
      <div data-testid="slot-ref-state">unset</div>
    </div>
  )
}
