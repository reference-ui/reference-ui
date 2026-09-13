import * as React from 'react'
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

export const Dialog = () => <DialogFixture />
export const Nested = () => <NestedFixture />
export const Outside = () => <OutsideFixture />
export const Scroll = () => <ScrollFixture />
export const Edge = () => <EdgeFixture />
export const Inert = () => <InertFixture />
export const Theme = () => <ThemeFixture />
export const Focus = () => (
  <>
    <FocusFixture />
    <FocusLockOverlayFixture />
  </>
)
export const Anchor = () => <AnchorFixture />
export const Exotica = () => <ExoticaFixture />
export const Frame = () => <FrameFixture />
