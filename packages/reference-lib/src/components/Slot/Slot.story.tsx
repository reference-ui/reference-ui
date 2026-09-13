import * as React from 'react'
import {
  createSlotRootContext,
  resolveSlotVisibility,
  createSlotCacheKey,
  type SlotVisibility,
} from './Slot'

const {
  Provider: SlotFixtureProvider,
  useSlotRegistration,
  useScanById,
  useGetAll,
  useRoot,
} = createSlotRootContext<{ testMeta?: string }>()

export function SlotFixture() {
  const [titleText, setTitleText] = React.useState('Initial Title')
  const [visibility, setVisibility] = React.useState<SlotVisibility>({ visible: true })
  const [renderPrefixActions, setRenderPrefixActions] = React.useState(true)

  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
  }

  return (
    <div
      data-testid="slot-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Slot Fixture</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-update-title"
          onClick={() => setTitleText('Updated Title')}
          style={buttonStyle}
        >
          Update Title
        </button>
        <button
          type="button"
          data-testid="btn-set-hidden"
          onClick={() => setVisibility({ hidden: true })}
          style={buttonStyle}
        >
          Set Hidden
        </button>
        <button
          type="button"
          data-testid="btn-set-unmounted"
          onClick={() => setVisibility({ visible: false })}
          style={buttonStyle}
        >
          Set Unmounted
        </button>
        <button
          type="button"
          data-testid="btn-set-visible"
          onClick={() => setVisibility({ visible: true })}
          style={buttonStyle}
        >
          Set Visible
        </button>
        <button
          type="button"
          data-testid="btn-toggle-actions"
          onClick={() => setRenderPrefixActions(p => !p)}
          style={buttonStyle}
        >
          Toggle Actions
        </button>
      </div>

      <SlotFixtureProvider>
        {/* Fillers */}
        <TitleFiller title={titleText} visibility={visibility} />
        {renderPrefixActions && (
          <>
            <ActionPrimaryFiller />
            <ActionSecondaryFiller />
          </>
        )}

        {/* Layout / Host */}
        <HostLayout />
      </SlotFixtureProvider>
    </div>
  )
}

function SlottedTitleContent({ title }: { title: string }) {
  const mountCountRef = React.useRef(0)
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    mountCountRef.current++
    setCount(mountCountRef.current)
  }, [])

  return (
    <span
      data-testid="slotted-title"
      data-mount-count={count}
      style={{
        fontWeight: 600,
        fontSize: '16px',
        color: '#1e293b',
      }}
    >
      {title}
    </span>
  )
}

function TitleFiller({
  title,
  visibility,
}: {
  title: string
  visibility: SlotVisibility
}) {
  useSlotRegistration(
    {
      slotId: 'title',
      visibility,
      element: <SlottedTitleContent title={title} />,
    },
    [visibility.visible, visibility.hidden]
  )

  return null
}

function ActionPrimaryFiller() {
  useSlotRegistration({
    slotId: 'actions.primary',
    element: (
      <button
        data-testid="btn-action-primary"
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          background: '#2563eb',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Primary Action
      </button>
    ),
  })
  return null
}

function ActionSecondaryFiller() {
  useSlotRegistration({
    slotId: 'actions.secondary',
    element: (
      <button
        data-testid="btn-action-secondary"
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          background: '#e2e8f0',
          color: '#1e293b',
          border: '1px solid #cbd5e1',
          cursor: 'pointer',
        }}
      >
        Secondary Action
      </button>
    ),
  })
  return null
}

function HostLayout() {
  const root = useRoot()
  const titleSlot = useScanById('title')
  const allSlots = useGetAll()

  const actionSlots = root.scanAll(s => s.slotId.startsWith('actions'))
  const cacheKey = createSlotCacheKey(actionSlots)

  const titleVisibility = resolveSlotVisibility(titleSlot?.visibility)

  return (
    <div
      data-testid="host-layout"
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '16px',
        background: '#f8fafc',
      }}
    >
      <header
        data-testid="region-header"
        data-cache-key={cacheKey}
        style={{ marginBottom: '16px', minHeight: '24px' }}
      >
        {titleVisibility === 'unmounted' ? null : (
          <div
            data-testid="header-container"
            style={{ display: titleVisibility === 'hidden' ? 'none' : 'block' }}
          >
            {titleSlot?.element}
          </div>
        )}
      </header>

      <footer
        data-testid="region-footer"
        style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}
      >
        {actionSlots.map(slot => (
          <React.Fragment key={slot.slotId}>{slot.element}</React.Fragment>
        ))}
      </footer>

      <div style={{ fontSize: '12px', color: '#64748b' }}>
        Registered slots: <span data-testid="registered-count">{allSlots.length}</span>
      </div>
    </div>
  )
}
