// Consumer probes for the SyncedSystem register (smoke pass 3). One probe per
// line. The gate reads this file: a line that carries the off-token value must
// fail with TS2322 naming that value; every on-token line and the offset line
// must compile. Each probe stays on one line so its diagnostic maps back to it.
import { Button, Div, type PrimitiveProps } from '@reference-ui/lib/primitives'
import { OverlayContent, TabsList } from '@reference-ui/lib'

// A consumer interface that extends the primitive shape, the way apps do.
export interface SmokeFrameProps extends Omit<PrimitiveProps<'div'>, 'children'> {
  label?: string
}

// 1. A Neo primitive reached through lib.
export const buttonOff = <Button color="smokeOffToken" />
export const buttonOn = <Button color="smoke.ink" />

// 2. A lib component built on PrimitiveProps.
export const tabsListOff = <TabsList color="smokeOffToken" />
export const tabsListOn = <TabsList color="smoke.ink" />

// 3. The css prop.
export const cssOff = <Div css={{ color: 'smokeOffToken' }} />
export const cssOn = <Div css={{ color: 'smoke.ink' }} />

// 4. An interface that extends Omit<PrimitiveProps<'div'>, ...>.
export const frameOff: SmokeFrameProps = { color: 'smokeOffToken' }
export const frameOn: SmokeFrameProps = { color: 'smoke.ink', label: 'frame' }

// 5. An own prop intersected with an open style prop: a number must still fit.
export const overlayOffset = <OverlayContent offset={8} />
