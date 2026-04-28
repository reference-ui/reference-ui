import { Div, H1, Main, P } from '@reference-ui/react'
import { cssMatrixClasses } from './styles'

export const matrixCssMarker = 'reference-ui-matrix-css'

export function Index() {
  return (
    <Main data-testid="css-root" p="4" gap="4">
      <H1>Reference UI css matrix</H1>
      <P>css() classes are exercised against emitted design-system CSS.</P>

      <Div data-testid="css-card" className={cssMatrixClasses.card}>
        CSS card
      </Div>

      <Div data-testid="css-positioned" className={cssMatrixClasses.positioned}>
        Positioned css()
      </Div>

      <Div data-testid="css-hoverable" className={cssMatrixClasses.hoverable}>
        Hoverable css()
      </Div>

      <Div data-testid="css-nested" className={cssMatrixClasses.nestedParent}>
        <Div data-slot="inner" data-testid="css-nested-child">
          Nested child css()
        </Div>
      </Div>

      <Div data-testid="css-state-closed" className={cssMatrixClasses.stateful} data-state="closed">
        Closed state css()
      </Div>

      <Div data-testid="css-state-open" className={cssMatrixClasses.stateful} data-state="open">
        Open state css()
      </Div>

      <Div
        data-testid="css-container-shell-narrow"
        style={{ containerName: 'sidebar', containerType: 'inline-size', width: '320px' }}
      >
        <Div data-testid="css-container-probe-narrow" className={cssMatrixClasses.containerProbe}>
          Narrow container probe
        </Div>
      </Div>

      <Div
        data-testid="css-container-shell-wide"
        style={{ containerName: 'sidebar', containerType: 'inline-size', width: '720px' }}
      >
        <Div data-testid="css-container-probe-wide" className={cssMatrixClasses.containerProbe}>
          Wide container probe
        </Div>
      </Div>
    </Main>
  )
}