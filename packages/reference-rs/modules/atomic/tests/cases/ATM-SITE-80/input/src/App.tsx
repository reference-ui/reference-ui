import { css, Div } from '@reference-ui/react'

const getColor = () => 'red'
const calledColor = getColor()

export const direct = css({ color: getColor(), margin: '13r' })
export const folded = css({ color: calledColor, margin: '13r' })

const getConfig = () => ({ color: 'teal.600', backgroundColor: 'navy' })
const config = getConfig()
export const spread = css({ ...config, padding: '4px' })
export const block = css(config)

const getSizes = () => ['2px', '4px']
const sizes = getSizes()
export const indexed = css({ marginTop: sizes[1], marginBottom: '6px' })

const roll = () => Math.random()
const unlucky = roll()
export const refused = css({ color: unlucky, margin: '1r' })

export function App() {
  return <Div color={calledColor} margin="2r" />
}
