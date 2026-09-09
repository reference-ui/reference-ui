import * as React from 'react'
import { Main, H1, P } from '@reference-ui/react'
import { DialogFixture } from './fixtures/dialog-fixture'
import { NestedFixture } from './fixtures/nested-fixture'
import { OutsideFixture } from './fixtures/outside-fixture'
import { ScrollFixture } from './fixtures/scroll-fixture'
import { EdgeFixture } from './fixtures/edge-fixture'
import { InertFixture } from './fixtures/inert-fixture'
import { ThemeFixture } from './fixtures/theme-fixture'
import { FocusFixture } from './fixtures/focus-fixture'
import { FocusLockOverlayFixture } from './fixtures/focus-lock-overlay-fixture'
import { AnchorFixture } from './fixtures/anchor-fixture'
import { ExoticaFixture } from './fixtures/exotica-fixture'
import { FrameFixture } from './fixtures/frame-fixture'

export function Index() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  if (path === '/overlay/dialog') return <DialogFixture />
  if (path === '/overlay/nested') return <NestedFixture />
  if (path === '/overlay/outside') return <OutsideFixture />
  if (path === '/overlay/scroll') return <ScrollFixture />
  if (path === '/overlay/edge') return <EdgeFixture />
  if (path === '/overlay/inert') return <InertFixture />
  if (path === '/overlay/theme') return <ThemeFixture />
  if (path === '/overlay/focus') {
    return (
      <>
        <FocusFixture />
        <FocusLockOverlayFixture />
      </>
    )
  }
  if (path === '/overlay/anchor') return <AnchorFixture />
  if (path === '/overlay/exotica') return <ExoticaFixture />
  if (path === '/overlay/frame') return <FrameFixture />

  return (
    <Main data-testid="overlays-root" p="4" gap="4">
      <H1>Reference UI Overlays Matrix</H1>
      <P>Production grade testing for Reference UI Overlay primitives.</P>

      <nav data-testid="overlays-nav" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <a href="/overlay/dialog">Dialog</a>
        <a href="/overlay/nested">Nested & Cascade</a>
        <a href="/overlay/outside">Outside Press</a>
        <a href="/overlay/scroll">Scroll Lock</a>
        <a href="/overlay/edge">Edge Sheet & Gesture</a>
        <a href="/overlay/inert">Inert Isolation</a>
        <a href="/overlay/theme">Theming</a>
        <a href="/overlay/focus">Focus & Restoration</a>
        <a href="/overlay/anchor">Anchored & Arrow</a>
        <a href="/overlay/exotica">Exotica</a>
      </nav>

      {/* When loading root / or /overlay, render comprehensive all-in-one suite */}
      <div data-testid="overlays-all-fixtures" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <DialogFixture />
        <hr />
        <NestedFixture />
        <hr />
        <OutsideFixture />
        <hr />
        <ScrollFixture />
        <hr />
        <EdgeFixture />
        <hr />
        <InertFixture />
        <hr />
        <ThemeFixture />
        <hr />
        <FocusFixture />
        <hr />
        <FocusLockOverlayFixture />
        <hr />
        <AnchorFixture />
      </div>
    </Main>
  )
}
