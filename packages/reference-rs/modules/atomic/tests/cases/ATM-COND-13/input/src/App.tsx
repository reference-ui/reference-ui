import { css } from '@reference-ui/react'

export function App() {
  const c = css({
    mdDown: { display: 'none' },
    mdOnly: { px: '2r' },
    smToLg: { maxWidth: '80ch' },
    watDown: { color: 'red.500' },
    // Non-bare custom widths (baseSystem.json): the range members drop
    // while the plans survive, so the differential pins the width gate.
    color: { tabletDown: 'red.500', md: 'blue.500' },
    marginTop: { smTotablet: '1r', lg: '2r' },
  })
  return <div className={c} />
}
