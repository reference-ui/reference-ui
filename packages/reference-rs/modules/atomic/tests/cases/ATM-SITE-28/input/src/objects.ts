import { css } from '@reference-ui/react'

// SPEC-V2-34 object half: const objects record identifier values and spreads.
const ember = 'amber.600'
const emberTheme = { primary: ember }
export const m = css({ color: emberTheme.primary })

const cardBase = { color: 'teal', padding: '6px' }
const cardButton = { ...cardBase, margin: '8px' }
export const n = css({ ...cardButton })

const cardOverride = { ...cardBase, color: 'blue' }
export const o = css({ color: cardOverride.color })

const inlandBox = { ...{ margin: '2px' }, padding: '1px' }
export const p = css({ ...inlandBox })
