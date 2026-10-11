/**
 * Sibling and nested providers register the same region name in separate roots.
 * Native editable content makes remounts, stale registrations and cross-instance leakage observable.
 */
import * as React from 'react'
import { createSlotRootContext } from './index'

const { Provider, useSlotRegistration, useSlot, useSlots } = createSlotRootContext()

function TitleRegistration({ title }: { title: string }) {
  useSlotRegistration({
    slotId: 'title',
    element: (
      <>
        <span data-testid="registered-title">{title}</span>
        <label>
          Editable title
          <input defaultValue={title} />
        </label>
      </>
    ),
  })
  return null
}

function RegionHost({ name }: { name: string }) {
  const title = useSlot('title')
  const slots = useSlots()
  return (
    <section data-testid={`slot-host-${name}`}>
      {title?.element}
      <output data-testid="registration-count">{slots.length}</output>
    </section>
  )
}

export function RegistryIsolationFixture() {
  const [title, setTitle] = React.useState('Outer')
  const [showFiller, setShowFiller] = React.useState(true)
  const [showNested, setShowNested] = React.useState(true)
  return (
    <>
      <button type="button" onClick={() => setTitle('Updated outer')}>Update outer title</button>
      <button type="button" onClick={() => setShowFiller(show => !show)}>Toggle outer filler</button>
      <button type="button" onClick={() => setShowNested(show => !show)}>Toggle nested provider</button>
      <Provider>
        {showFiller && <TitleRegistration title={title} />}
        <RegionHost name="outer" />
        {showNested && (
          <Provider>
            <TitleRegistration title="Inner" />
            <RegionHost name="inner" />
          </Provider>
        )}
      </Provider>
      <Provider>
        <TitleRegistration title="Sibling" />
        <RegionHost name="sibling" />
      </Provider>
    </>
  )
}
