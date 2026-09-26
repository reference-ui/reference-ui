import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Splitter } from './index'

// Instrument convention: Layout displays round (drag deltas are definitionally
// fractional under the Panel-axis-sum denominator); exact request arrays are
// proven through raw *-last-request logs, never these lines.

export const Basic = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-fixture-root">
        <Div
          width="100r"
          height="50r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter"
            value={value}
            onChange={setValue}
            height="100%"
          >
            <Splitter.Panel
              data-testid="splitter-panel-0"
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left Pane ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="splitter-handle-0" />
            <Splitter.Panel
              data-testid="splitter-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right Pane ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="splitter-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Constrained = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-constrained-root">
        <Div
          width="100r"
          height="50r"
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter-constrained"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="constrained-panel-0"
              min={20}
              max={60}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="constrained-handle-0" />
            <Splitter.Panel
              data-testid="constrained-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="constrained-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const CollapsibleDemo = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)
  const [lastRequest, setLastRequest] = React.useState('')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-collapsible-root">
        <Div
          width="100r"
          height="50r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter-collapsible"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setLastRequest(next.join(','))
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="collapsible-panel-0"
              min={20}
              collapsible
              collapsedSize={5}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="collapsible-handle-0" />
            <Splitter.Panel
              data-testid="collapsible-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="collapsible-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="collapsible-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="collapsible-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="collapsible-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ThreePanel = () => {
  const [value, setValue] = React.useState<number[]>([20, 30, 50])
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-threepanel-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-threepanel"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel data-testid="threepanel-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">A ({Math.round(value[0])}%)</Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="threepanel-handle-0" />
            <Splitter.Panel data-testid="threepanel-panel-1" p="3r" bg="ui.field.background" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">B ({Math.round(value[1])}%)</Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="threepanel-handle-1" />
            <Splitter.Panel data-testid="threepanel-panel-2" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">C ({Math.round(value[2])}%)</Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="threepanel-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}% / {Math.round(value[2])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="threepanel-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="threepanel-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

// Render-counted content: increments a window counter per commit so CT can
// prove per-move commit isolation without causing commits itself.
const CountedContent = ({ id, label }: { id: string; label: string }) => {
  const w = window as unknown as { __spCommits?: Record<string, number> }
  w.__spCommits = w.__spCommits ?? {}
  w.__spCommits[id] = (w.__spCommits[id] ?? 0) + 1
  return (
    <Span fontSize="3r" fontWeight="500">
      {label}
    </Span>
  )
}
const MemoCountedContent = React.memo(CountedContent)

// Idle sibling group for session-scoping proofs (SP-PERF-07): never touched,
// so any resizing hook or end on it is a leak from another instance.
const SiblingGroup = () => {
  const [value, setValue] = React.useState<number[]>([50, 50])
  const [ends, setEnds] = React.useState(0)
  return (
    <Div width="100r" height="30r" borderRadius="md" overflow="hidden" mt="4r">
      <Splitter
        data-testid="nested-sibling"
        value={value}
        onChange={setValue}
        onChangeEnd={() => setEnds((c) => c + 1)}
        height="100%"
      >
        <Splitter.Panel data-testid="nested-sibling-panel-0">Sib A</Splitter.Panel>
        <Splitter.Handle data-testid="nested-sibling-handle-0" aria-label="Resize sibling" />
        <Splitter.Panel data-testid="nested-sibling-panel-1">Sib B</Splitter.Panel>
      </Splitter>
      <Span data-testid="nested-sibling-display" fontSize="3r" color="design.text.base">
        Sibling: {Math.round(value[0])}% / {Math.round(value[1])}%
      </Span>
      <Span data-testid="nested-sibling-ends" fontSize="3r" color="design.text.base" ml="4r">
        {ends}
      </Span>
    </Div>
  )
}

export const Nested = () => {
  const [outer, setOuter] = React.useState<number[]>([40, 60])
  const [inner, setInner] = React.useState<number[]>([50, 50])
  const [outerEnds, setOuterEnds] = React.useState(0)
  const [innerEnds, setInnerEnds] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-nested-root">
        <Div width="100r" height="60r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="nested-outer"
            value={outer}
            onChange={setOuter}
            onChangeEnd={() => setOuterEnds((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel data-testid="nested-outer-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">Nav ({Math.round(outer[0])}%)</Span>
              <MemoCountedContent id="nested-outer-panel-0" label="" />
            </Splitter.Panel>
            <Splitter.Handle data-testid="nested-outer-handle-0" />
            <Splitter.Panel data-testid="nested-outer-panel-1" bg="ui.field.background" color="design.text.base">
              <Splitter
                orientation="vertical"
                data-testid="nested-inner"
                value={inner}
                onChange={setInner}
                onChangeEnd={() => setInnerEnds((c) => c + 1)}
                height="100%"
              >
                <Splitter.Panel data-testid="nested-inner-panel-0" p="3r">
                  <Span fontSize="3r" fontWeight="500">Editor ({Math.round(inner[0])}%)</Span>
                </Splitter.Panel>
                <Splitter.Handle data-testid="nested-inner-handle-0" />
                <Splitter.Panel data-testid="nested-inner-panel-1" p="3r">
                  <Span fontSize="3r" fontWeight="500">Console ({Math.round(inner[1])}%)</Span>
                </Splitter.Panel>
              </Splitter>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="nested-outer-display" fontSize="3.5r" color="design.text.base">
          Outer: {Math.round(outer[0])}% / {Math.round(outer[1])}%
        </Span>
        <Span data-testid="nested-inner-display" fontSize="3.5r" color="design.text.base" ml="4r">
          Inner: {Math.round(inner[0])}% / {Math.round(inner[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="nested-outer-ends" fontSize="3r" color="design.text.base">
            {outerEnds}
          </Span>
          <Span data-testid="nested-inner-ends" fontSize="3r" color="design.text.base">
            {innerEnds}
          </Span>
        </Div>
        <SiblingGroup />
      </Div>
    </ReferenceLibrary>
  )
}

export const Sidebar = () => {
  const [value, setValue] = React.useState<number[]>([30, 70])
  const [max, setMax] = React.useState(100)
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)
  const [lastRequest, setLastRequest] = React.useState('')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-sidebar-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-sidebar"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setLastRequest(next.join(','))
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="sidebar-panel-0"
              min={20}
              max={max}
              collapsible
              collapsedSize={5}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Sidebar ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="sidebar-handle-0" aria-label="Resize sidebar" />
            <Splitter.Panel
              data-testid="sidebar-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Main ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="sidebar-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="sidebar-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="sidebar-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="sidebar-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
        <Div display="flex" gap="4r" mt="2r">
          <button data-testid="sidebar-tighten" onClick={() => setMax(25)}>
            Tighten
          </button>
          <button data-testid="sidebar-loosen" onClick={() => setMax(100)}>
            Loosen
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const RtlSidebar = () => {
  const [value, setValue] = React.useState<number[]>([30, 70])
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" dir="rtl" data-testid="splitter-rtl-sidebar-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-rtl-sidebar"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="rtl-sidebar-panel-0"
              min={20}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                A ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="rtl-sidebar-handle-0" aria-label="Resize panels" />
            <Splitter.Panel
              data-testid="rtl-sidebar-panel-1"
              min={20}
              collapsible
              collapsedSize={5}
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                B ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="rtl-sidebar-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="rtl-sidebar-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="rtl-sidebar-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

const DirToggleBase = ({ orientation }: { orientation: 'horizontal' | 'vertical' }) => {
  const [dir, setDir] = React.useState<'ltr' | 'rtl'>('ltr')
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [changeCount, setChangeCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" dir={dir} data-testid="splitter-dirtoggle-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            orientation={orientation}
            data-testid="test-splitter-dirtoggle"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setValue(next)
            }}
            height="100%"
          >
            <Splitter.Panel
              id="dirtoggle-sidebar"
              data-testid="dirtoggle-panel-a"
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                A ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="dirtoggle-handle-0" aria-label="Resize A and B" />
            <Splitter.Panel
              data-testid="dirtoggle-panel-b"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                B ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="dirtoggle-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Span data-testid="dirtoggle-dir-display" fontSize="3r" color="design.text.base" ml="4r">
          {dir}
        </Span>
        <Span data-testid="dirtoggle-change-count" fontSize="3r" color="design.text.base" ml="4r">
          {changeCount}
        </Span>
        <Div mt="2r">
          <button
            data-testid="dirtoggle-toggle"
            onClick={() => setDir((d) => (d === 'ltr' ? 'rtl' : 'ltr'))}
          >
            Toggle direction
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DirToggle = () => <DirToggleBase orientation="horizontal" />
export const DirToggleVertical = () => <DirToggleBase orientation="vertical" />

export const Rejecting = () => {
  const [max, setMax] = React.useState(100)
  const [handlerId, setHandlerId] = React.useState('A')
  const [requests, setRequests] = React.useState<string[]>([])
  const [ends, setEnds] = React.useState<string[]>([])
  const [echoed, setEchoed] = React.useState(false)

  // Controlled value the parent echoes only when the echo toggle is armed,
  // so mid-gesture echoes stay an explicit test action.
  const value = echoed ? [45, 55] : [40, 60]
  const tag = handlerId
  const handleChange = (next: number[]) =>
    setRequests((r) => [...r, `${tag}:[${next.join(',')}]`])
  const handleEnd = (next: number[]) => setEnds((e) => [...e, `${tag}:[${next.join(',')}]`])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-rejecting-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-rejecting"
            value={value}
            onChange={handleChange}
            onChangeEnd={handleEnd}
            height="100%"
          >
            <Splitter.Panel
              data-testid="rejecting-panel-0"
              min={20}
              max={max}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="rejecting-handle-0" />
            <Splitter.Panel
              data-testid="rejecting-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="rejecting-requests" fontSize="3r" color="design.text.base">
          {requests.join(' | ')}
        </Span>
        <Span data-testid="rejecting-ends" fontSize="3r" color="design.text.base" ml="4r">
          {ends.join(' | ')}
        </Span>
        <Span data-testid="rejecting-handler" fontSize="3r" color="design.text.base" ml="4r">
          {handlerId}
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <button data-testid="rejecting-swap-constraints" onClick={() => setMax(50)}>
            Cap max at 50
          </button>
          <button data-testid="rejecting-swap-handler" onClick={() => setHandlerId('B')}>
            Use handler B
          </button>
          <button data-testid="rejecting-echo" onClick={() => setEchoed(true)}>
            Echo [45,55]
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const KeyPassthrough = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [changeCount, setChangeCount] = React.useState(0)
  const [received, setReceived] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-passthrough-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-passthrough"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setValue(next)
            }}
            height="100%"
          >
            <Splitter.Panel data-testid="passthrough-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle
              data-testid="passthrough-handle-0"
              onKeyDown={(e) =>
                setReceived((r) => [
                  ...r,
                  `${e.key}|${e.ctrlKey ? 'c' : ''}${e.metaKey ? 'm' : ''}${e.altKey ? 'a' : ''}${e.shiftKey ? 's' : ''}`,
                ])
              }
            />
            <Splitter.Panel data-testid="passthrough-panel-1" p="3r" bg="ui.field.background" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="passthrough-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Span data-testid="passthrough-change-count" fontSize="3r" color="design.text.base" ml="4r">
          {changeCount}
        </Span>
        <Span data-testid="passthrough-received" fontSize="3r" color="design.text.base" ml="4r">
          {received.join(' ')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// Structural errors throw (FEATURES #9); fixtures that provoke them render
// the diagnostic through this boundary and recover on resetKey change.
class SplitterErrorBoundary extends React.Component<
  { resetKey: unknown; testId: string; children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  componentDidUpdate(prevProps: { resetKey: unknown }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ error: null })
    }
  }
  render() {
    if (this.state.error) {
      return (
        <Div data-testid={this.props.testId} p="3r" color="design.text.base">
          {this.state.error}
        </Div>
      )
    }
    return this.props.children
  }
}

export const Lifecycle = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [disabled, setDisabled] = React.useState(false)
  const [mounted, setMounted] = React.useState(true)
  const [handleMounted, setHandleMounted] = React.useState(true)
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-lifecycle-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          {mounted ? (
            <SplitterErrorBoundary
              testId="lifecycle-structure-error"
              resetKey={handleMounted}
            >
              <Splitter
                data-testid="test-splitter-lifecycle"
                value={value}
                onChange={(next) => {
                  setChangeCount((c) => c + 1)
                  setValue(next)
                }}
                onChangeEnd={() => setChangeEndCount((c) => c + 1)}
                height="100%"
              >
                <Splitter.Panel data-testid="lifecycle-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
                  <Span fontSize="3r" fontWeight="500">
                    Left ({Math.round(value[0])}%)
                  </Span>
                </Splitter.Panel>
                {handleMounted ? (
                  <Splitter.Handle data-testid="lifecycle-handle-0" disabled={disabled} />
                ) : null}
                <Splitter.Panel data-testid="lifecycle-panel-1" p="3r" bg="ui.field.background" color="design.text.base">
                  <Span fontSize="3r" fontWeight="500">
                    Right ({Math.round(value[1])}%)
                  </Span>
                </Splitter.Panel>
              </Splitter>
            </SplitterErrorBoundary>
          ) : (
            <Div data-testid="lifecycle-unmounted" p="3r" color="design.text.base">
              Unmounted
            </Div>
          )}
        </Div>

        <Span data-testid="lifecycle-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="lifecycle-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="lifecycle-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
        </Div>
        <Div display="flex" gap="4r" mt="2r">
          <button data-testid="lifecycle-toggle-disabled" onClick={() => setDisabled((d) => !d)}>
            Toggle disabled
          </button>
          <button data-testid="lifecycle-toggle-mounted" onClick={() => setMounted((m) => !m)}>
            Toggle mounted
          </button>
          <button data-testid="lifecycle-toggle-handle" onClick={() => setHandleMounted((h) => !h)}>
            Toggle handle
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const A11ySweep = () => (
  <ReferenceLibrary>
    <Div p="6r" colorMode="dark" data-testid="splitter-a11y-root">
      <Div width="100r" height="40r" border="1px solid" borderColor="ui.field.border" mb="4r" data-testid="a11y-group-horizontal">
        <Splitter value={[40, 60]} height="100%">
          <Splitter.Panel>Left</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-horizontal-handle-0" aria-label="Resize main panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      </Div>
      <Div width="80r" height="50r" border="1px solid" borderColor="ui.field.border" mb="4r" data-testid="a11y-group-vertical">
        <Splitter orientation="vertical" value={[50, 50]} height="100%">
          <Splitter.Panel>Top</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-vertical-handle-0" aria-label="Resize editor panels" />
          <Splitter.Panel>Bottom</Splitter.Panel>
        </Splitter>
      </Div>
      <Div width="100r" height="40r" border="1px solid" borderColor="ui.field.border" mb="4r" data-testid="a11y-group-three">
        <Splitter value={[20, 30, 50]} height="100%">
          <Splitter.Panel>A</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-three-handle-0" aria-label="Resize A and B" />
          <Splitter.Panel>B</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-three-handle-1" aria-label="Resize B and C" />
          <Splitter.Panel>C</Splitter.Panel>
        </Splitter>
      </Div>
      <Div width="100r" height="40r" border="1px solid" borderColor="ui.field.border" mb="4r" data-testid="a11y-group-mixed">
        <Splitter value={[25, 50, 25]} height="100%">
          <Splitter.Panel min={10} max={40}>A</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-mixed-handle-0" aria-label="Resize constrained A" />
          <Splitter.Panel min={30}>B</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-mixed-handle-1" aria-label="Resize frozen panels" disabled />
          <Splitter.Panel min={10} max={40}>C</Splitter.Panel>
        </Splitter>
      </Div>
      <Div width="100r" height="40r" border="1px solid" borderColor="ui.field.border" mb="4r" data-testid="a11y-group-collapsed">
        <Splitter value={[5, 95]} height="100%">
          <Splitter.Panel min={20} collapsible collapsedSize={5}>Sidebar</Splitter.Panel>
          <Splitter.Handle data-testid="a11y-collapsed-handle-0" aria-label="Resize sidebar panels" />
          <Splitter.Panel>Main</Splitter.Panel>
        </Splitter>
      </Div>
    </Div>
  </ReferenceLibrary>
)

export const Vertical = () => {
  const [value, setValue] = React.useState<number[]>([50, 50])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-vertical-root">
        <Div
          width="80r"
          height="60r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          overflow="hidden"
        >
          <Splitter
            orientation="vertical"
            value={value}
            onChange={setValue}
            height="100%"
          >
            <Splitter.Panel
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">Top ({Math.round(value[0])}%)</Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="splitter-vertical-handle" />
            <Splitter.Panel
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">Bottom ({Math.round(value[1])}%)</Span>
            </Splitter.Panel>
          </Splitter>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

// --- FEATURES cluster B fixtures ---

export const StructureErrors = () => {
  const panel = (testId: string, content: string) => (
    <Splitter.Panel data-testid={testId}>{content}</Splitter.Panel>
  )
  const handle = (testId: string) => <Splitter.Handle data-testid={testId} />
  const cases: Array<{ id: string; label: string; value: number[]; tree: React.ReactNode }> = [
    {
      id: 'leading-handle',
      label: 'Leading Handle',
      value: [50, 50],
      tree: (
        <>
          {handle('structure-leading-handle-0')}
          {panel('structure-leading-panel-0', 'A')}
          {handle('structure-leading-handle-1')}
          {panel('structure-leading-panel-1', 'B')}
        </>
      ),
    },
    {
      id: 'trailing-handle',
      label: 'Trailing Handle',
      value: [50, 50],
      tree: (
        <>
          {panel('structure-trailing-panel-0', 'A')}
          {handle('structure-trailing-handle-0')}
          {panel('structure-trailing-panel-1', 'B')}
          {handle('structure-trailing-handle-1')}
        </>
      ),
    },
    {
      id: 'consecutive-handles',
      label: 'Consecutive Handles',
      value: [50, 50],
      tree: (
        <>
          {panel('structure-doubled-panel-0', 'A')}
          {handle('structure-doubled-handle-0')}
          {handle('structure-doubled-handle-1')}
          {panel('structure-doubled-panel-1', 'B')}
        </>
      ),
    },
    {
      id: 'consecutive-panels',
      label: 'Consecutive Panels',
      value: [50, 50],
      tree: (
        <>
          {panel('structure-naked-panel-0', 'A')}
          {panel('structure-naked-panel-1', 'B')}
        </>
      ),
    },
    {
      id: 'one-panel',
      label: 'One Panel',
      value: [100],
      tree: <>{panel('structure-solo-panel-0', 'Only')}</>,
    },
    {
      id: 'value-short',
      label: 'Short value',
      value: [40],
      tree: (
        <>
          {panel('structure-short-panel-0', 'A')}
          {handle('structure-short-handle-0')}
          {panel('structure-short-panel-1', 'B')}
        </>
      ),
    },
    {
      id: 'value-long',
      label: 'Long value',
      value: [30, 30, 40],
      tree: (
        <>
          {panel('structure-long-panel-0', 'A')}
          {handle('structure-long-handle-0')}
          {panel('structure-long-panel-1', 'B')}
        </>
      ),
    },
    {
      id: 'misordered',
      label: 'Right counts, wrong order',
      value: [50, 50],
      tree: (
        <>
          {panel('structure-order-panel-0', 'A')}
          {panel('structure-order-panel-1', 'B')}
          {handle('structure-order-handle-0')}
        </>
      ),
    },
  ]
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-structure-root">
        {cases.map((c) => (
          <Div key={c.id} mb="4r" data-testid={`structure-case-${c.id}`}>
            <Span fontSize="3r" color="design.text.base">
              {c.label}
            </Span>
            <SplitterErrorBoundary testId={`structure-error-${c.id}`} resetKey={c.id}>
              <Splitter value={c.value} height="100%">
                {c.tree}
              </Splitter>
            </SplitterErrorBoundary>
          </Div>
        ))}
      </Div>
    </ReferenceLibrary>
  )
}

interface DynPanelSpec {
  id: string
  label: string
  collapsible?: boolean
  min?: number
}

const DYN_START: DynPanelSpec[] = [
  { id: 'a', label: 'A', collapsible: true, min: 20 },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]
const DYN_D: DynPanelSpec = { id: 'd', label: 'D', collapsible: true, min: 10 }

export const Dynamic = () => {
  const [order, setOrder] = React.useState<DynPanelSpec[]>(DYN_START)
  const [value, setValue] = React.useState<number[]>([30, 35, 35])
  const [hiddenB, setHiddenB] = React.useState(false)
  const [programmatic, setProgrammatic] = React.useState(false)
  const [lastRequest, setLastRequest] = React.useState('')
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-dynamic-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <SplitterErrorBoundary
            testId="dynamic-structure-error"
            resetKey={JSON.stringify({ o: order.map((p) => p.id), h: hiddenB, v: value })}
          >
            <Splitter
              data-testid="test-splitter-dynamic"
              value={value}
              onChange={(next) => {
                setChangeCount((c) => c + 1)
                setLastRequest(next.join(','))
                setValue(next)
              }}
              onChangeEnd={() => setChangeEndCount((c) => c + 1)}
              height="100%"
            >
              {order.flatMap((spec, slot) => {
                const parts: React.ReactNode[] = []
                if (!(spec.id === 'b' && hiddenB)) {
                  parts.push(
                    <Splitter.Panel
                      key={spec.id}
                      id={`dynamic-panel-id-${spec.id}`}
                      data-testid={`dynamic-panel-${spec.id}`}
                      min={spec.min}
                      collapsible={spec.collapsible}
                      collapsedSize={spec.collapsible ? 5 : undefined}
                      p="3r"
                      bg="ui.table.row.mutedBackground"
                      color="design.text.base"
                    >
                      <Span fontSize="3r" fontWeight="500">
                        {spec.label} ({Math.round(value[slot] ?? 0)}%)
                      </Span>
                    </Splitter.Panel>
                  )
                }
                if (slot < order.length - 1) {
                  parts.push(
                    <Splitter.Handle
                      key={`h${slot}`}
                      data-testid={`dynamic-handle-${slot}`}
                      aria-label={`Resize ${spec.label} boundary`}
                    />
                  )
                }
                return parts
              })}
            </Splitter>
          </SplitterErrorBoundary>
        </Div>

        <Span data-testid="dynamic-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {value.map((v) => `${Math.round(v)}%`).join(' / ')}
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="dynamic-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="dynamic-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="dynamic-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
        <Div display="flex" gap="4r" mt="2r">
          <button
            data-testid="dynamic-op-reorder"
            onClick={() => {
              setOrder([{ ...DYN_START[1]! }, { ...DYN_START[0]! }, { ...DYN_START[2]! }])
              setValue([60, 5, 35])
            }}
          >
            Reorder B/A/C
          </button>
          <button
            data-testid="dynamic-op-remove-a"
            onClick={() => {
              setOrder(order.filter((p) => p.id !== 'a'))
              setValue([70, 30])
            }}
          >
            Remove A
          </button>
          <button
            data-testid="dynamic-op-insert-d"
            onClick={() => {
              setOrder((o) => [o[0]!, { ...DYN_D }, o[1]!].filter(Boolean) as DynPanelSpec[])
              setValue([60, 20, 20])
            }}
          >
            Insert D
          </button>
          <button
            data-testid="dynamic-op-reinsert-a"
            onClick={() => {
              setOrder((o) => [{ ...DYN_START[0]! }, ...o])
              setValue([5, 60, 20, 15])
            }}
          >
            Reinsert A
          </button>
          <button data-testid="dynamic-op-hide-b" onClick={() => setHiddenB((h) => !h)}>
            Toggle hide B
          </button>
          <button
            data-testid="dynamic-op-programmatic"
            onClick={() => {
              setProgrammatic((p) => !p)
              setValue(programmatic ? [30, 35, 35] : [5, 60, 35])
            }}
          >
            Toggle programmatic
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const Blocked = () => {
  const [value, setValue] = React.useState<number[]>([20, 30, 50])
  const [disabled0, setDisabled0] = React.useState(false)
  const [pinned, setPinned] = React.useState(false)
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)
  const [lastRequest, setLastRequest] = React.useState('')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-blocked-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-blocked"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setLastRequest(next.join(','))
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel data-testid="blocked-panel-0" min={10} p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">
                A ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle
              data-testid="blocked-handle-0"
              aria-label="Resize A and B"
              disabled={disabled0}
            />
            <Splitter.Panel
              data-testid="blocked-panel-1"
              min={pinned ? 30 : 10}
              max={pinned ? 30 : 100}
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                B ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="blocked-handle-1" aria-label="Resize B and C" />
            <Splitter.Panel
              data-testid="blocked-panel-2"
              min={pinned ? 50 : 10}
              max={pinned ? 50 : 100}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                C ({Math.round(value[2])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="blocked-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}% / {Math.round(value[2])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="blocked-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="blocked-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="blocked-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
        <Div display="flex" gap="4r" mt="2r">
          <button data-testid="blocked-toggle-disabled" onClick={() => setDisabled0((d) => !d)}>
            Toggle handle 0 disabled
          </button>
          <button data-testid="blocked-toggle-pinned" onClick={() => setPinned((p) => !p)}>
            Toggle B/C pinned
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const Measured = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [wide, setWide] = React.useState(false)
  const [lastRequest, setLastRequest] = React.useState('')
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  // Exact frame: 501px content minus the 1px Handle footprint leaves exactly
  // 500px of Panel space (1001 → 1000), so measured bounds resolve exactly.
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-measured-root">
        <Div
          style={{ width: wide ? 1001 : 501, height: 200 }}
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter-measured"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setLastRequest(next.join(','))
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="measured-panel-0"
              min="120px"
              max="450px"
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="measured-handle-0" aria-label="Resize measured panels" />
            <Splitter.Panel
              data-testid="measured-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="measured-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="measured-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="measured-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="measured-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
        <Div display="flex" gap="4r" mt="2r">
          <button data-testid="measured-toggle-width" onClick={() => setWide((w) => !w)}>
            Toggle 501/1001
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const MeasuredVertical = () => {
  const [value, setValue] = React.useState<number[]>([70, 30])
  const [lastRequest, setLastRequest] = React.useState('')
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-measured-v-root">
        <Div
          style={{ width: 320, height: 501 }}
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            orientation="vertical"
            data-testid="test-splitter-measured-v"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setLastRequest(next.join(','))
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="measured-v-panel-0"
              min={40}
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Editor ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="measured-v-handle-0" aria-label="Resize editor panels" />
            <Splitter.Panel
              data-testid="measured-v-panel-1"
              min="120px"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Console ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="measured-v-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="measured-v-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="measured-v-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="measured-v-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const MeasuredR = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [wide, setWide] = React.useState(false)
  const [lastRequest, setLastRequest] = React.useState('')
  const [changeCount, setChangeCount] = React.useState(0)
  const [changeEndCount, setChangeEndCount] = React.useState(0)

  // 401px content minus the 1px Handle footprint: exactly 400px of Panel
  // space, so 12r at the pinned 4px root is exactly 12 points.
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-measuredr-root">
        <Div
          style={{ width: 401, height: 200, '--spacing-root': wide ? '8px' : '4px' } as React.CSSProperties}
          borderRadius="md"
          overflow="hidden"
          mb="4r"
        >
          <Splitter
            data-testid="test-splitter-measuredr"
            value={value}
            onChange={(next) => {
              setChangeCount((c) => c + 1)
              setLastRequest(next.join(','))
              setValue(next)
            }}
            onChangeEnd={() => setChangeEndCount((c) => c + 1)}
            height="100%"
          >
            <Splitter.Panel
              data-testid="measuredr-panel-0"
              min="12r"
              max="40%"
              p="3r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="measuredr-handle-0" aria-label="Resize r panels" />
            <Splitter.Panel
              data-testid="measuredr-panel-1"
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="measuredr-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="measuredr-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="measuredr-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
          </Span>
          <Span data-testid="measuredr-last-request" fontSize="3r" color="design.text.base">
            {lastRequest}
          </Span>
        </Div>
        <Div display="flex" gap="4r" mt="2r">
          <button data-testid="measuredr-toggle-spacing" onClick={() => setWide((w) => !w)}>
            Toggle 4px/8px root
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const PerfRejected = () => {
  // Fixed value; requests log to window with NO setState, so any Panel
  // descendant commit during moves is Splitter's own (SP-PERF-01).
  const value = [40, 60]
  const log = (next: number[]) => {
    const w = window as unknown as { __spRequests?: string[] }
    w.__spRequests = w.__spRequests ?? []
    w.__spRequests.push(next.join(','))
  }
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-perf-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-perf"
            value={value}
            onChange={log}
            onChangeEnd={log}
            height="100%"
          >
            <Splitter.Panel data-testid="perf-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <CountedContent id="perf-panel-0" label="Left" />
            </Splitter.Panel>
            <Splitter.Handle data-testid="perf-handle-0" aria-label="Resize perf panels" />
            <Splitter.Panel data-testid="perf-panel-1" p="3r" bg="ui.field.background" color="design.text.base">
              <CountedContent id="perf-panel-1" label="Right" />
            </Splitter.Panel>
          </Splitter>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DelayedEcho = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [ends, setEnds] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-delayed-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-delayed"
            value={value}
            onChange={(next) => {
              requestAnimationFrame(() => setValue(next))
            }}
            onChangeEnd={(next) => setEnds((e) => [...e, next.join(',')])}
            height="100%"
          >
            <Splitter.Panel data-testid="delayed-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">
                Left ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="delayed-handle-0" aria-label="Resize delayed panels" />
            <Splitter.Panel data-testid="delayed-panel-1" p="3r" bg="ui.field.background" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">
                Right ({Math.round(value[1])}%)
              </Span>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="delayed-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Span data-testid="delayed-ends" fontSize="3r" color="design.text.base" ml="4r">
          {ends.join(' | ')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const InnerGrid = () => {
  const [value, setValue] = React.useState<number[]>([40, 60])
  const [lastRequest, setLastRequest] = React.useState('')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="splitter-innergrid-root">
        <Div width="100r" height="50r" borderRadius="md" overflow="hidden" mb="4r">
          <Splitter
            data-testid="test-splitter-innergrid"
            value={value}
            onChange={(next) => {
              setLastRequest(next.join(','))
              setValue(next)
            }}
            height="100%"
          >
            <Splitter.Panel data-testid="innergrid-panel-0" p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
              <Span fontSize="3r" fontWeight="500">
                Nav ({Math.round(value[0])}%)
              </Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="innergrid-handle-0" aria-label="Resize grid panels" />
            <Splitter.Panel data-testid="innergrid-panel-1" bg="ui.field.background">
              <div
                data-testid="innergrid-grid"
                style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', height: '100%' }}
              >
                <div data-testid="innergrid-cell-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  One
                </div>
                <div data-testid="innergrid-cell-1" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  Two
                </div>
              </div>
            </Splitter.Panel>
          </Splitter>
        </Div>

        <Span data-testid="innergrid-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {Math.round(value[0])}% / {Math.round(value[1])}%
        </Span>
        <Span data-testid="innergrid-last-request" fontSize="3r" color="design.text.base" ml="4r">
          {lastRequest}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}
