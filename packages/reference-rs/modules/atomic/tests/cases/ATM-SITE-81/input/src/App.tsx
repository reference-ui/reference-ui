import { css, Div } from '@reference-ui/react'

export const focusRingStyles = {
  outline: '2px solid transparent',
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'ui.focus.ring',
    outlineOffset: '2px',
  },
} as const

export const focusRing = focusRingStyles._focusVisible

export function App() {
  return <Div _focusVisible={focusRing} color="red" />
}

export const spread = css({ ...focusRing, padding: '4px' })

const styles = {
  hover: { color: 'blue.700', backgroundColor: 'gray.100' },
  padding: '8px',
}
const merged = { ...styles.hover, margin: '2r' }
export const memberSpread = css({ ...merged, borderWidth: '1px' })
export const direct = css({ ...styles.hover, margin: '3r' })

export const live = { primary: { color: 'green.600' } }
export const aliasLive = live.primary
live.primary = { color: 'red' }
export const poisoned = css({ ...aliasLive, margin: '4r' })
export const poisonedMember = css({ ...live.primary, margin: '5r' })
