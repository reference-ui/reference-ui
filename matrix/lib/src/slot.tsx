import * as React from 'react'
import {
  createSlotRootContext,
  resolveSlotVisibility,
  createSlotCacheKey,
  type SlotVisibility,
} from '@reference-ui/lib'

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

  return (
    <div data-testid="slot-fixture-root">
      <h1>Slot Fixture</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-update-title"
          onClick={() => setTitleText('Updated Title')}
        >
          Update Title
        </button>
        <button
          type="button"
          data-testid="btn-set-hidden"
          onClick={() => setVisibility({ hidden: true })}
        >
          Set Hidden
        </button>
        <button
          type="button"
          data-testid="btn-set-unmounted"
          onClick={() => setVisibility({ visible: false })}
        >
          Set Unmounted
        </button>
        <button
          type="button"
          data-testid="btn-set-visible"
          onClick={() => setVisibility({ visible: true })}
        >
          Set Visible
        </button>
        <button
          type="button"
          data-testid="btn-toggle-actions"
          onClick={() => setRenderPrefixActions(p => !p)}
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
    <span data-testid="slotted-title" data-mount-count={count}>
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
    element: <button data-testid="btn-action-primary">Primary Action</button>,
  })
  return null
}

function ActionSecondaryFiller() {
  useSlotRegistration({
    slotId: 'actions.secondary',
    element: <button data-testid="btn-action-secondary">Secondary Action</button>,
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
    <div data-testid="host-layout" style={{ border: '1px solid #ccc', padding: '16px' }}>
      <header data-testid="region-header" data-cache-key={cacheKey}>
        {titleVisibility === 'unmounted' ? null : (
          <div
            data-testid="header-container"
            style={{ display: titleVisibility === 'hidden' ? 'none' : 'block' }}
          >
            {titleSlot?.element}
          </div>
        )}
      </header>

      <footer data-testid="region-footer">
        {actionSlots.map(slot => (
          <React.Fragment key={slot.slotId}>{slot.element}</React.Fragment>
        ))}
      </footer>

      <div data-testid="registered-count">{allSlots.length}</div>
    </div>
  )
}
