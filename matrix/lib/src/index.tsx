import React from 'react'
import { H1, Main, P } from '@reference-ui/react'
import { SlotFixture } from './slot'
import { PresenceFixture } from './presence'
import { PortalFixture } from './portal'
import { FocusLockFixture } from './focus-lock'
import { RovingFocusFixture } from './roving-focus'
import { ReferenceLibraryFixture } from './reference-library'
import { OverlayFixture } from './overlay'
import { PopoverFixture } from './popover'
import { TooltipFixture } from './tooltip'
import { ToastFixture } from './toast'
import { FieldFixture } from './field'
import { SwitchFixture } from './switch'
import { CollapsibleFixture } from './collapsible'
import { AccordionFixture } from './accordion'
import { TabsFixture } from './tabs'
import { SliderFixture } from './slider'
import { SplitterFixture } from './splitter'
import { MenuFixture } from './menu'
import { ListboxFixture } from './listbox'
import { ComboboxFixture } from './combobox'
import { CalendarFixture } from './calendar'
import { DateFieldFixture } from './date-field'
import { NumberFieldFixture } from './number-field'
import { TreeFixture } from './tree'

export function Index() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  if (path === '/slot') {
    return <SlotFixture />
  }

  if (path === '/presence') {
    return <PresenceFixture />
  }

  if (path === '/portal') {
    return <PortalFixture />
  }

  if (path === '/focus-lock') {
    return <FocusLockFixture />
  }

  if (path === '/roving-focus') {
    return <RovingFocusFixture />
  }

  if (path === '/reference-library') {
    return <ReferenceLibraryFixture />
  }

  if (path === '/overlay') {
    return <OverlayFixture />
  }

  if (path === '/popover') {
    return <PopoverFixture />
  }

  if (path === '/tooltip') {
    return <TooltipFixture />
  }

  if (path === '/toast') {
    return <ToastFixture />
  }

  if (path === '/field') {
    return <FieldFixture />
  }

  if (path === '/switch') {
    return <SwitchFixture />
  }

  if (path === '/collapsible') {
    return <CollapsibleFixture />
  }

  if (path === '/accordion') {
    return <AccordionFixture />
  }

  if (path === '/tabs') {
    return <TabsFixture />
  }

  if (path === '/slider') {
    return <SliderFixture />
  }

  if (path === '/splitter') {
    return <SplitterFixture />
  }

  if (path === '/menu') {
    return <MenuFixture />
  }

  if (path === '/listbox') {
    return <ListboxFixture />
  }

  if (path === '/combobox') {
    return <ComboboxFixture />
  }

  if (path === '/calendar') {
    return <CalendarFixture />
  }

  if (path === '/date-field') {
    return <DateFieldFixture />
  }

  if (path === '/number-field') {
    return <NumberFieldFixture />
  }

  if (path === '/tree') {
    return <TreeFixture />
  }

  return (
    <Main data-testid="lib-root" p="4" gap="3">
      <H1>Reference UI lib</H1>
      <P>Library fixture for foundation and ARIA primitives.</P>
      <P data-testid="react-version">{React.version}</P>
    </Main>
  )
}
