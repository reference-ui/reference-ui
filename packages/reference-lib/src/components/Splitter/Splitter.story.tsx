import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Splitter } from './index'

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
          Layout: {value[0]}% / {value[1]}%
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
          Layout: {value[0]}% / {value[1]}%
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
          Layout: {value[0]}% / {value[1]}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="collapsible-change-count" fontSize="3r" color="design.text.base">
            {changeCount}
          </Span>
          <Span data-testid="collapsible-change-end-count" fontSize="3r" color="design.text.base">
            {changeEndCount}
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
          Layout: {value[0]}% / {value[1]}% / {value[2]}%
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
          Outer: {outer[0]}% / {outer[1]}%
        </Span>
        <Span data-testid="nested-inner-display" fontSize="3.5r" color="design.text.base" ml="4r">
          Inner: {inner[0]}% / {inner[1]}%
        </Span>
        <Div display="flex" gap="4r" mt="2r">
          <Span data-testid="nested-outer-ends" fontSize="3r" color="design.text.base">
            {outerEnds}
          </Span>
          <Span data-testid="nested-inner-ends" fontSize="3r" color="design.text.base">
            {innerEnds}
          </Span>
        </Div>
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
          Layout: {value[0]}% / {value[1]}%
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
          Layout: {value[0]}% / {value[1]}%
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
          Layout: {value[0]}% / {value[1]}%
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

  // Fixed controlled value: the parent never echoes, so every request is rejected.
  const value = [40, 60]
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
          Layout: {value[0]}% / {value[1]}%
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
          ) : (
            <Div data-testid="lifecycle-unmounted" p="3r" color="design.text.base">
              Unmounted
            </Div>
          )}
        </Div>

        <Span data-testid="lifecycle-value-display" fontSize="3.5r" color="design.text.base">
          Layout: {value[0]}% / {value[1]}%
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
              <Span fontSize="3r" fontWeight="500">Top ({value[0]}%)</Span>
            </Splitter.Panel>
            <Splitter.Handle data-testid="splitter-vertical-handle" />
            <Splitter.Panel
              p="3r"
              bg="ui.field.background"
              color="design.text.base"
            >
              <Span fontSize="3r" fontWeight="500">Bottom ({value[1]}%)</Span>
            </Splitter.Panel>
          </Splitter>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}
