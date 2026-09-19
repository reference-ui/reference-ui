import { css } from './ui'
import { css as c } from './ui'

// Direct wrapper re-export, plus the consumer-side alias.
export const a = css({ color: 'red' })
export const b = c({ padding: '4px' })
